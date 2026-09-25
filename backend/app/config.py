import os
from pydantic_settings import BaseSettings

# 获取 nn_UI 项目根目录（config.py 的上两级目录）
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

class Settings(BaseSettings):
    PORT: int = 8765
    HOST: str = "127.0.0.1"
    DEBUG: bool = True
    AUTO_SAVE_INTERVAL: int = 30
    
    # 使用 nn_UI 项目根目录下的文件夹
    DATA_DIR: str = os.path.join(_PROJECT_ROOT, "data")
    PROJECT_DIR: str = os.path.join(_PROJECT_ROOT, "projects")
    BLOCKS_DIR: str = os.path.join(_PROJECT_ROOT, "blocks")
    CHECKPOINTS_DIR: str = os.path.join(_PROJECT_ROOT, "checkpoints")
    EXPORTS_DIR: str = os.path.join(_PROJECT_ROOT, "exports")
    AUTOSAVE_PATH: str = os.path.join(_PROJECT_ROOT, "data", "autosave.json")
    SETTINGS_PATH: str = os.path.join(_PROJECT_ROOT, "data", "settings.json")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()