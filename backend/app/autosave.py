import os
import json
import time
from datetime import datetime
from .config import settings
from .state import get_state

class AutoSave:
    def __init__(self):
        self._last_save_time = 0
        self._pending_save = False
    
    def request_save(self):
        self._pending_save = True
    
    def check_and_save(self):
        current_time = time.time()
        
        if self._pending_save and (current_time - self._last_save_time) >= settings.AUTO_SAVE_INTERVAL:
            self._save()
            self._last_save_time = current_time
            self._pending_save = False
            return True
        
        return False
    
    def _save(self):
        try:
            state = get_state()
            data = {
                "version": "1.0",
                "saved_at": datetime.now().isoformat(),
                "nodes": state.current_graph.nodes,
                "edges": state.current_graph.edges,
            }
            
            os.makedirs(os.path.dirname(settings.AUTOSAVE_PATH), exist_ok=True)
            
            with open(settings.AUTOSAVE_PATH, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"Autosaved to {settings.AUTOSAVE_PATH}")
        except Exception as e:
            print(f"Autosave failed: {e}")
    
    def load(self) -> dict | None:
        if not os.path.exists(settings.AUTOSAVE_PATH):
            return None
        
        try:
            with open(settings.AUTOSAVE_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to load autosave: {e}")
            return None

auto_save = AutoSave()