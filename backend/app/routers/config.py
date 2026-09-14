import os
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import ORJSONResponse
from pydantic import BaseModel
from typing import List

from app.core.config import PICKING_CSV_PATH

router = APIRouter(prefix="/api/config", tags=["config"])

CONFIG_PATH = os.path.join(os.path.dirname(PICKING_CSV_PATH), "config.json")

class ConfigData(BaseModel):
    warehouse_name: str
    warehouses: List[str]
    carriers: List[str]

def load_config() -> dict:
    default_config = {
        "warehouse_name": "Bodega Principal",
        "warehouses": ["Bodega Principal"],
        "carriers": ["DHL Express", "FedEx", "Coordinadora", "Servientrega"]
    }
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Asegurar compatibilidad
                if "warehouses" not in data:
                    wh_name = data.get("warehouse_name", "Bodega Principal")
                    data["warehouses"] = [wh_name]
                return data
        except Exception:
            pass
    return default_config

def save_config(data: dict):
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@router.get("/")
async def get_config():
    """Obtiene la configuración activa (nombre de bodega, centros de distribución y transportadoras)."""
    return ORJSONResponse(content=load_config())

@router.post("/")
async def update_config(data: ConfigData):
    """Actualiza la configuración en caliente."""
    try:
        config_dict = {
            "warehouse_name": data.warehouse_name.strip(),
            "warehouses": [w.strip() for w in data.warehouses if w.strip()],
            "carriers": [c.strip() for c in data.carriers if c.strip()]
        }
        # Si la lista de bodegas tiene elementos, asegurar que warehouse_name sea el primero para compatibilidad
        if config_dict["warehouses"]:
            config_dict["warehouse_name"] = config_dict["warehouses"][0]
        save_config(config_dict)
        return {"message": "Configuración guardada con éxito"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
