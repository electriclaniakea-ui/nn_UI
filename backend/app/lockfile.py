import os
import uuid
import time
from datetime import datetime, timedelta
from .config import settings

class LockFile:
    def __init__(self):
        self.lock_path = os.path.join(settings.PROJECT_DIR, ".lock")
    
    def acquire(self) -> str:
        os.makedirs(os.path.dirname(self.lock_path), exist_ok=True)
        
        lock_id = str(uuid.uuid4())
        lock_data = {
            "id": lock_id,
            "timestamp": time.time(),
            "pid": os.getpid(),
        }
        
        with open(self.lock_path, 'w') as f:
            import json
            json.dump(lock_data, f)
        
        return lock_id
    
    def release(self):
        if os.path.exists(self.lock_path):
            os.remove(self.lock_path)
    
    def is_locked(self) -> bool:
        if not os.path.exists(self.lock_path):
            return False
        
        try:
            import json
            with open(self.lock_path, 'r') as f:
                lock_data = json.load(f)
            
            lock_time = lock_data.get("timestamp", 0)
            if time.time() - lock_time > 10:
                self.release()
                return False
            
            return True
        except Exception:
            return False
    
    def get_lock_info(self) -> dict | None:
        if not os.path.exists(self.lock_path):
            return None
        
        try:
            import json
            with open(self.lock_path, 'r') as f:
                return json.load(f)
        except Exception:
            return None

lock_file = LockFile()