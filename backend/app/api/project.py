from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import json
import shutil
from datetime import datetime
from ..config import settings

router = APIRouter(prefix="/api/projects", tags=["projects"])

class ProjectMeta(BaseModel):
    name: str
    path: str
    node_count: int
    updated_at: str
    is_example: bool = False

class ProjectPathRequest(BaseModel):
    path: str

class SaveProjectRequest(BaseModel):
    name: str
    nodes: list
    edges: list = []
    description: str = ""

@router.get("")
async def list_projects():
    projects = []
    project_dir = settings.PROJECT_DIR

    if not os.path.exists(project_dir):
        return {"projects": projects, "project_dir": project_dir}

    for filename in os.listdir(project_dir):
        if filename.endswith(".nnproj"):
            filepath = os.path.join(project_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                projects.append(ProjectMeta(
                    name=data.get("name", filename.replace(".nnproj", "")),
                    path=filepath,
                    node_count=len(data.get("nodes", [])),
                    updated_at=data.get("saved_at", ""),
                    is_example=data.get("is_example", False),
                ))
            except Exception:
                continue

    return {"projects": projects, "project_dir": project_dir}

@router.get("/path")
async def get_project_path():
    return {"project_dir": settings.PROJECT_DIR}

@router.post("/path")
async def set_project_path(request: ProjectPathRequest):
    new_path = os.path.expanduser(request.path)
    try:
        os.makedirs(new_path, exist_ok=True)
        settings.PROJECT_DIR = new_path
        return {"project_dir": new_path, "success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"无法设置项目路径: {str(e)}")

@router.post("")
async def save_project(request: SaveProjectRequest):
    project_dir = settings.PROJECT_DIR
    os.makedirs(project_dir, exist_ok=True)

    safe_name = request.name.replace("/", "_").replace("\\", "_")
    filepath = os.path.join(project_dir, f"{safe_name}.nnproj")

    project_data = {
        "version": "1.0",
        "name": request.name,
        "description": request.description,
        "saved_at": datetime.now().isoformat(),
        "nodes": request.nodes,
        "edges": request.edges,
    }

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(project_data, f, ensure_ascii=False, indent=2)

    return {"path": filepath, "success": True}

@router.get("/{project_name}")
async def load_project(project_name: str):
    filepath = os.path.join(settings.PROJECT_DIR, f"{project_name}.nnproj")

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Project not found")

    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

@router.delete("/{project_name}")
async def delete_project(project_name: str):
    filepath = os.path.join(settings.PROJECT_DIR, f"{project_name}.nnproj")

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        os.remove(filepath)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")


class RenameProjectRequest(BaseModel):
    new_name: str

@router.post("/{project_name}/rename")
async def rename_project(project_name: str, request: RenameProjectRequest):
    old_filepath = os.path.join(settings.PROJECT_DIR, f"{project_name}.nnproj")
    if not os.path.exists(old_filepath):
        raise HTTPException(status_code=404, detail="Project not found")

    safe_new_name = request.new_name.replace("/", "_").replace("\\", "_")
    new_filepath = os.path.join(settings.PROJECT_DIR, f"{safe_new_name}.nnproj")

    if os.path.exists(new_filepath):
        raise HTTPException(status_code=400, detail="同名项目已存在")

    try:
        # 读取旧文件
        with open(old_filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        # 更新名称
        data["name"] = request.new_name
        data["saved_at"] = datetime.now().isoformat()
        # 写入新文件
        with open(new_filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        # 删除旧文件
        os.remove(old_filepath)
        return {"success": True, "new_name": request.new_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"重命名失败: {str(e)}")


@router.post("/{project_name}/duplicate")
async def duplicate_project(project_name: str):
    old_filepath = os.path.join(settings.PROJECT_DIR, f"{project_name}.nnproj")
    if not os.path.exists(old_filepath):
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        with open(old_filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 生成新名称
        base_name = data.get("name", project_name)
        new_name = f"{base_name}_副本"
        counter = 1
        while os.path.exists(os.path.join(settings.PROJECT_DIR, f"{new_name}.nnproj")):
            new_name = f"{base_name}_副本{counter}"
            counter += 1

        data["name"] = new_name
        data["saved_at"] = datetime.now().isoformat()
        data["is_example"] = False

        new_filepath = os.path.join(settings.PROJECT_DIR, f"{new_name}.nnproj")
        with open(new_filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return {"success": True, "new_name": new_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"复制失败: {str(e)}")


# ==================== App Data API ====================

class AppDataPayload(BaseModel):
    key: str
    data: dict

@router.get("/app-data/{key}")
async def get_app_data(key: str):
    """获取应用数据（settings / canvas / 等）"""
    data_dir = settings.DATA_DIR
    os.makedirs(data_dir, exist_ok=True)
    filepath = os.path.join(data_dir, f"{key}.json")

    if not os.path.exists(filepath):
        return {"key": key, "data": None}

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return {"key": key, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"读取失败: {str(e)}")

@router.post("/app-data/{key}")
async def save_app_data(key: str, payload: AppDataPayload):
    """保存应用数据"""
    data_dir = settings.DATA_DIR
    os.makedirs(data_dir, exist_ok=True)
    filepath = os.path.join(data_dir, f"{key}.json")

    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(payload.data, f, ensure_ascii=False, indent=2)
        return {"key": key, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")

@router.delete("/app-data/{key}")
async def delete_app_data(key: str):
    """删除应用数据"""
    data_dir = settings.DATA_DIR
    filepath = os.path.join(data_dir, f"{key}.json")

    if os.path.exists(filepath):
        try:
            os.remove(filepath)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")

    return {"key": key, "success": True}