import json
import os
from datetime import datetime
from typing import Any
from ..config import settings

class Serializer:
    CURRENT_VERSION = "1.0"
    
    def save_project(self, name: str, nodes: list, edges: list = [], path: str | None = None) -> str:
        if path is None:
            os.makedirs(settings.PROJECT_DIR, exist_ok=True)
            safe_name = name.replace("/", "_").replace("\\", "_")
            path = os.path.join(settings.PROJECT_DIR, f"{safe_name}.nnproj")
        
        project_data = {
            "version": self.CURRENT_VERSION,
            "name": name,
            "saved_at": datetime.now().isoformat(),
            "nodes": nodes,
            "edges": edges,
        }
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(project_data, f, ensure_ascii=False, indent=2)
        
        return path
    
    def load_project(self, path: str) -> dict:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        version = data.get("version", "1.0")
        
        if version != self.CURRENT_VERSION:
            data = self._migrate(data, version, self.CURRENT_VERSION)
        
        return data
    
    def _migrate(self, data: dict, from_version: str, to_version: str) -> dict:
        migration_chain = {
            "1.0": {},
        }
        
        current_data = data
        current_version = from_version
        
        while current_version != to_version:
            if current_version not in migration_chain:
                raise ValueError(f"无法从版本 {current_version} 迁移到 {to_version}")
            
            migration_func = migration_chain[current_version]
            current_data = migration_func(current_data) if migration_func else current_data
            
            version_parts = current_version.split(".")
            version_parts[-1] = str(int(version_parts[-1]) + 1)
            current_version = ".".join(version_parts)
        
        return current_data
    
    def list_projects(self) -> list[dict]:
        projects = []
        
        if not os.path.exists(settings.PROJECT_DIR):
            return projects
        
        for filename in os.listdir(settings.PROJECT_DIR):
            if filename.endswith(".nnproj"):
                filepath = os.path.join(settings.PROJECT_DIR, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        file_data = json.load(f)
                    
                    projects.append({
                        "name": file_data.get("name", filename.replace(".nnproj", "")),
                        "path": filepath,
                        "node_count": len(file_data.get("nodes", [])),
                        "updated_at": file_data.get("saved_at", ""),
                    })
                except Exception:
                    continue
        
        return projects

serializer = Serializer()