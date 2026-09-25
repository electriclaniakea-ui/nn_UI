from typing import Any
import os
import json
from datetime import datetime
from ..config import settings

class BlockManager:
    def __init__(self):
        self.blocks_dir = settings.BLOCKS_DIR
    
    def create_block(self, name: str, nodes: list, input_ports: int = 1, output_ports: int = 1) -> dict:
        os.makedirs(self.blocks_dir, exist_ok=True)
        
        safe_name = name.replace("/", "_").replace("\\", "_")
        block_id = f"block_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        block_data = {
            "id": block_id,
            "name": name,
            "version": "1.0",
            "nodes": nodes,
            "input_ports": input_ports,
            "output_ports": output_ports,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }
        
        filepath = os.path.join(self.blocks_dir, f"{safe_name}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(block_data, f, ensure_ascii=False, indent=2)
        
        return block_data
    
    def load_block(self, name: str) -> dict | None:
        filepath = os.path.join(self.blocks_dir, f"{name}.json")
        
        if not os.path.exists(filepath):
            return None
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def list_blocks(self) -> list[dict]:
        blocks = []
        
        if not os.path.exists(self.blocks_dir):
            return blocks
        
        for filename in os.listdir(self.blocks_dir):
            if filename.endswith(".json"):
                filepath = os.path.join(self.blocks_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    blocks.append({
                        "id": data.get("id", ""),
                        "name": data.get("name", filename.replace(".json", "")),
                        "layer_count": len(data.get("nodes", [])),
                        "created_at": data.get("created_at", ""),
                        "updated_at": data.get("updated_at", ""),
                    })
                except Exception:
                    continue
        
        return blocks
    
    def delete_block(self, name: str) -> bool:
        filepath = os.path.join(self.blocks_dir, f"{name}.json")
        
        if not os.path.exists(filepath):
            return False
        
        os.remove(filepath)
        return True
    
    def update_block(self, name: str, updates: dict) -> dict | None:
        block = self.load_block(name)
        
        if not block:
            return None
        
        block.update(updates)
        block["updated_at"] = datetime.now().isoformat()
        
        filepath = os.path.join(self.blocks_dir, f"{name}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(block, f, ensure_ascii=False, indent=2)
        
        return block

block_manager = BlockManager()