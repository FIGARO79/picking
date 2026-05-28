from typing import Optional, List, Dict
from pydantic import BaseModel

class PickingAuditItem(BaseModel):
    code: str
    description: str
    order_line: Optional[str] = ''
    qty_req: int
    qty_scan: int

class PackageDimension(BaseModel):
    package_number: int
    length: float
    width: float
    height: float
    weight: Optional[float] = 0.0

class PickingAuditCreate(BaseModel):
    order_number: str
    despatch_number: str
    customer_name: str
    customer_code: Optional[str] = None
    status: str
    username: str  # Nombre del auditor ingresado al iniciar sesión
    items: List[PickingAuditItem]
    packages: Optional[int] = 0
    packages_assignment: Optional[Dict[str, Dict[str, int]]] = {} # { "item_code:order_line": { "1": qty } }
    packages_dimensions: Optional[List[PackageDimension]] = []

class ShipmentCreate(BaseModel):
    audit_ids: List[int]
    note: Optional[str] = None
    carrier: Optional[str] = None
    username: str  # Nombre del auditor

class ShipmentUpdate(BaseModel):
    carrier: Optional[str] = None
    note: Optional[str] = None

