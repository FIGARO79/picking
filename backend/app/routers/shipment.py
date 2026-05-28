import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.responses import ORJSONResponse
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.i18n import get_message
from app.models.schemas import ShipmentCreate, ShipmentUpdate
from app.models.sql_models import (
    Shipment, 
    ShipmentAudit, 
    PickingAudit as PickingAuditModel, 
    PickingPackageItem, 
    PickingAuditItem,
    PickingPackage
)

router = APIRouter(prefix="/api/shipments", tags=["shipments"])

@router.post("/", status_code=201)
async def create_shipment(
    data: ShipmentCreate, 
    db: AsyncSession = Depends(get_db), 
    accept_language: str = Header("es")
):
    """Crea un envío consolidado agrupando múltiples auditorías."""
    if not data.audit_ids:
        raise HTTPException(
            status_code=400, 
            detail=get_message("shipment_select_audit", accept_language)
        )
        
    # Verificar que las auditorías existen
    result = await db.execute(
        select(PickingAuditModel).where(PickingAuditModel.id.in_(data.audit_ids))
    )
    audits = result.scalars().all()
    if len(audits) != len(data.audit_ids):
        raise HTTPException(
            status_code=404, 
            detail=get_message("shipment_audits_not_found", accept_language)
        )
        
    # Crear el despacho consolidado
    shipment = Shipment(
        username=data.username.strip(),
        note=data.note,
        carrier=data.carrier,
        created_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
    )
    db.add(shipment)
    await db.flush() # Obtener ID auto-generado
    
    # Vincular auditorías
    for audit_id in data.audit_ids:
        link = ShipmentAudit(shipment_id=shipment.id, audit_id=audit_id)
        db.add(link)
        
    await db.commit()
    return {
        "id": shipment.id, 
        "message": get_message(
            "shipment_created_success", 
            accept_language, 
            shipment_id=shipment.id, 
            count=len(data.audit_ids)
        )
    }

@router.get("/")
async def list_shipments(db: AsyncSession = Depends(get_db)):
    """Lista todos los despachos consolidados registrados."""
    try:
        result = await db.execute(
            select(Shipment)
            .options(selectinload(Shipment.audit_links).selectinload(ShipmentAudit.audit))
            .order_by(Shipment.id.desc())
        )
        shipments = result.scalars().unique().all()
        
        response = []
        for s in shipments:
            audits_info = []
            for link in s.audit_links:
                audit = link.audit
                audits_info.append({
                    "audit_id": audit.id,
                    "order_number": audit.order_number,
                    "despatch_number": audit.despatch_number,
                    "customer_code": str(audit.customer_code or "").strip(),
                    "customer_name": str(audit.customer_name or "N/A").strip(),
                    "packages": audit.packages or 0
                })
                
            response.append({
                "id": s.id,
                "created_at": s.created_at,
                "username": s.username,
                "note": s.note or "",
                "carrier": s.carrier or "",
                "status": s.status,
                "total_orders": len(audits_info),
                "audits": audits_info
            })
        return ORJSONResponse(content=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{shipment_id}")
async def get_shipment(
    shipment_id: int, 
    db: AsyncSession = Depends(get_db), 
    accept_language: str = Header("es")
):
    """Obtiene el detalle de un despacho consolidado."""
    try:
        result = await db.execute(
            select(Shipment)
            .options(selectinload(Shipment.audit_links).selectinload(ShipmentAudit.audit))
            .where(Shipment.id == shipment_id)
        )
        shipment = result.scalars().unique().first()
        if not shipment:
            raise HTTPException(
                status_code=404, 
                detail=get_message("shipment_not_found", accept_language, shipment_id=shipment_id)
            )
            
        audits_info = []
        for link in shipment.audit_links:
            audit = link.audit
            audits_info.append({
                "audit_id": audit.id,
                "order_number": audit.order_number,
                "despatch_number": audit.despatch_number,
                "customer_code": str(audit.customer_code or "").strip(),
                "customer_name": str(audit.customer_name or "N/A").strip(),
                "packages": audit.packages or 0
            })
            
        return ORJSONResponse(content={
            "id": shipment.id,
            "created_at": shipment.created_at,
            "username": shipment.username,
            "note": shipment.note or "",
            "carrier": shipment.carrier or "",
            "status": shipment.status,
            "audits": audits_info
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{shipment_id}/packing_list")
async def get_consolidated_packing_list(
    shipment_id: int, 
    db: AsyncSession = Depends(get_db), 
    accept_language: str = Header("es")
):
    """Genera los datos del packing list consolidado por pedido e items de bultos."""
    try:
        result = await db.execute(
            select(Shipment)
            .options(selectinload(Shipment.audit_links).selectinload(ShipmentAudit.audit))
            .where(Shipment.id == shipment_id)
        )
        shipment = result.scalars().unique().first()
        if not shipment:
            raise HTTPException(
                status_code=404, 
                detail=get_message("shipment_not_found", accept_language, shipment_id=shipment_id)
            )
            
        if shipment.status != "active":
            raise HTTPException(
                status_code=400, 
                detail=get_message("shipment_already_cancelled", accept_language)
            )
            
        orders = []
        for link in shipment.audit_links:
            audit = link.audit
            
            # Mapeo de order_line
            items_res = await db.execute(select(PickingAuditItem).where(PickingAuditItem.audit_id == audit.id))
            items_map = {item.item_code: item.order_line for item in items_res.scalars().all()}
            
            # Cargar items de bultos
            pkg_res = await db.execute(
                select(PickingPackageItem)
                .where(PickingPackageItem.audit_id == audit.id)
                .order_by(PickingPackageItem.package_number, PickingPackageItem.item_code)
            )
            package_items = pkg_res.scalars().all()
            
            packages = {}
            for item in package_items:
                pkg_num = str(item.package_number)
                if pkg_num not in packages:
                    packages[pkg_num] = []
                packages[pkg_num].append({
                    "order_line": item.order_line or items_map.get(item.item_code, ""),
                    "item_code": item.item_code,
                    "description": item.description or "",
                    "quantity": item.qty_scan
                })
                
            # Cargar dimensiones de bultos
            pkg_dims_res = await db.execute(
                select(PickingPackage)
                .where(PickingPackage.audit_id == audit.id)
            )
            packages_dimensions = {
                str(p.package_number): {
                    "length": p.length or 0.0,
                    "width": p.width or 0.0,
                    "height": p.height or 0.0,
                    "weight": p.weight or 0.0
                }
                for p in pkg_dims_res.scalars().all()
            }
                
            orders.append({
                "audit_id": audit.id,
                "order_number": audit.order_number,
                "despatch_number": audit.despatch_number,
                "customer_code": str(audit.customer_code or "").strip(),
                "customer_name": str(audit.customer_name or "N/A").strip(),
                "timestamp": audit.timestamp,
                "total_packages": audit.packages or 0,
                "packages": packages,
                "packages_dimensions": packages_dimensions
            })
            
        return ORJSONResponse(content={
            "shipment_id": shipment.id,
            "created_at": shipment.created_at,
            "carrier": shipment.carrier or "",
            "note": shipment.note or "",
            "total_orders": len(orders),
            "orders": orders
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{shipment_id}")
async def update_shipment(
    shipment_id: int, 
    data: ShipmentUpdate, 
    db: AsyncSession = Depends(get_db), 
    accept_language: str = Header("es")
):
    """Actualiza la transportadora y la nota de un envío consolidado."""
    try:
        result = await db.execute(select(Shipment).where(Shipment.id == shipment_id))
        shipment = result.scalars().first()
        if not shipment:
            raise HTTPException(
                status_code=404, 
                detail=get_message("shipment_not_found", accept_language, shipment_id=shipment_id)
            )
            
        if data.carrier is not None:
            shipment.carrier = data.carrier.strip()
        if data.note is not None:
            shipment.note = data.note.strip()
            
        await db.commit()
        return {
            "message": get_message("shipment_updated_success", accept_language, shipment_id=shipment_id),
            "shipment_id": shipment_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{shipment_id}")
async def cancel_shipment(
    shipment_id: int, 
    db: AsyncSession = Depends(get_db), 
    accept_language: str = Header("es")
):
    """Cancela (soft-delete) un envío consolidado."""
    try:
        result = await db.execute(select(Shipment).where(Shipment.id == shipment_id))
        shipment = result.scalars().first()
        if not shipment:
            raise HTTPException(
                status_code=404, 
                detail=get_message("shipment_not_found", accept_language, shipment_id=shipment_id)
            )
            
        shipment.status = "cancelled"
        await db.commit()
        return {
            "message": get_message("shipment_cancelled_success", accept_language, shipment_id=shipment_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
