import os
import datetime
import shutil
import polars as pl
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Header
from fastapi.responses import ORJSONResponse
from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import PICKING_CSV_PATH
from app.core.db import get_db
from app.core.i18n import get_message
from app.models.schemas import PickingAuditCreate
from app.models.sql_models import (
    PickingAudit as PickingAuditModel, 
    PickingAuditItem, 
    PickingPackageItem, 
    PickingPackage
)

router = APIRouter(prefix="/api", tags=["picking"])

@router.post("/update/picking_file")
async def update_picking_file(file: UploadFile = File(...), accept_language: str = Header("es")):
    """Actualiza en caliente el archivo CSV de picking (240)."""
    try:
        # Asegurar que el directorio databases existe
        os.makedirs(os.path.dirname(PICKING_CSV_PATH), exist_ok=True)
        
        # Guardar el archivo temporalmente y verificarlo con Polars antes de reemplazar
        temp_path = PICKING_CSV_PATH + ".tmp"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        try:
            df = pl.read_csv(temp_path, infer_schema_length=0)
            df.columns = [c.lstrip('\ufeff') for c in df.columns]
            
            # Validar columnas mínimas
            required = ["ORDER_", "DESPATCH_", "ITEM", "QTY"]
            if not all(col in df.columns for col in required):
                raise Exception(get_message("csv_missing_columns", accept_language))
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(
                status_code=400, 
                detail=get_message("csv_invalid", accept_language, error=str(e))
            )
            
        # Reemplazar archivo real
        if os.path.exists(PICKING_CSV_PATH):
            os.remove(PICKING_CSV_PATH)
        os.rename(temp_path, PICKING_CSV_PATH)
        
        return {"message": get_message("csv_updated", accept_language, filename=file.filename)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/picking/order/{order_number}/{despatch_number}")
async def get_picking_order(order_number: str, despatch_number: str, accept_language: str = Header("es")):
    """Obtiene los detalles de un pedido de picking desde el CSV."""
    try:
        if not os.path.exists(PICKING_CSV_PATH):
            raise HTTPException(
                status_code=404, 
                detail=get_message("csv_not_found", accept_language)
            )

        df = pl.read_csv(PICKING_CSV_PATH, infer_schema_length=0)
        df.columns = [c.lstrip('\ufeff') for c in df.columns]
        
        customer_col = "CUSTOMER" if "CUSTOMER" in df.columns else ("CUSTOMER_CODE" if "CUSTOMER_CODE" in df.columns else None)
        
        required_columns = ["ORDER_", "DESPATCH_", "ITEM", "DESCRIPTION", "QTY", "CUSTOMER_NAME", "ORDER_LINE"]
        if not all(col in df.columns for col in required_columns) or not customer_col:
            raise HTTPException(
                status_code=500, 
                detail=get_message("csv_bad_columns", accept_language)
            )

        # Limpiar columnas clave
        df = df.with_columns([
            pl.col("ORDER_").cast(pl.Utf8).str.strip_chars(),
            pl.col("DESPATCH_").cast(pl.Utf8).str.strip_chars()
        ])
        if "QTY" in df.columns:
            df = df.with_columns(pl.col("QTY").cast(pl.Utf8).str.replace_all(',', ''))

        order_number_clean = str(order_number).strip()
        despatch_number_clean = str(despatch_number).strip()

        order_data = df.filter(
            (pl.col("ORDER_") == order_number_clean) & 
            (pl.col("DESPATCH_") == despatch_number_clean)
        )

        if order_data.height == 0:
            raise HTTPException(
                status_code=404, 
                detail=get_message(
                    "order_not_found", 
                    accept_language, 
                    order_number=order_number, 
                    despatch_number=despatch_number
                )
            )

        # Renombrar para consistencia en la UI
        rename_map = {
            "ORDER_": "Order Number",
            "DESPATCH_": "Despatch Number",
            "ITEM": "Item Code",
            "DESCRIPTION": "Item Description",
            "QTY": "Qty",
            "CUSTOMER_NAME": "Customer Name",
            "ORDER_LINE": "Order Line"
        }
        if customer_col:
            rename_map[customer_col] = "Customer Code"
            
        order_data = order_data.rename(rename_map)
        order_data = order_data.with_columns([
            pl.col("Customer Code").cast(pl.Utf8).str.strip_chars() if "Customer Code" in order_data.columns else pl.lit(""),
            pl.col("Customer Name").cast(pl.Utf8).str.strip_chars()
        ])
        order_data = order_data.fill_null("")
        
        return ORJSONResponse(content=order_data.to_dicts())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/picking/tracking")
async def get_picking_tracking(db: AsyncSession = Depends(get_db)):
    """Obtiene el listado de todos los pedidos disponibles en el CSV de picking."""
    try:
        if not os.path.exists(PICKING_CSV_PATH):
            return ORJSONResponse(content=[])

        df = pl.read_csv(PICKING_CSV_PATH, infer_schema_length=0)
        df.columns = [c.lstrip('\ufeff') for c in df.columns]

        # Filtrar líneas vacías
        df = df.filter(
            (pl.col("ORDER_").is_not_null()) & 
            (pl.col("ORDER_").cast(pl.Utf8).str.strip_chars() != "")
        )

        customer_col = "CUSTOMER" if "CUSTOMER" in df.columns else "CUSTOMER_CODE"
        required_columns = ["ORDER_", "DESPATCH_", "CUSTOMER_NAME", "PICK_LIST_PRINTED_TIME", "Time_Zone_Hours"]
        if not all(col in df.columns for col in required_columns) or customer_col not in df.columns:
            # Fallback en caso de que falten algunas columnas menores
            customer_col = "CUSTOMER" if "CUSTOMER" in df.columns else ("CUSTOMER_CODE" if "CUSTOMER_CODE" in df.columns else "ORDER_")

        # Limpiar datos
        df = df.with_columns([
            pl.col("ORDER_").cast(pl.Utf8).str.strip_chars(),
            pl.col("DESPATCH_").cast(pl.Utf8).str.strip_chars(),
            pl.col(customer_col).cast(pl.Utf8).fill_null(""),
            pl.col("CUSTOMER_NAME").cast(pl.Utf8).fill_null(""),
            pl.col("PICK_LIST_PRINTED_TIME").cast(pl.Utf8).str.strip_chars().fill_null("") if "PICK_LIST_PRINTED_TIME" in df.columns else pl.lit(""),
            pl.col("Time_Zone_Hours").cast(pl.Utf8).str.strip_chars().fill_null("") if "Time_Zone_Hours" in df.columns else pl.lit("")
        ])

        # Agrupar
        grouped = df.group_by(["ORDER_", "DESPATCH_", customer_col, "CUSTOMER_NAME"]).agg([
            pl.col("ORDER_").len().alias("total_lines"),
            pl.col("PICK_LIST_PRINTED_TIME").filter(pl.col("PICK_LIST_PRINTED_TIME") != "").first().alias("print_time") if "PICK_LIST_PRINTED_TIME" in df.columns else pl.lit("").first().alias("print_time"),
            pl.col("Time_Zone_Hours").filter(pl.col("Time_Zone_Hours") != "").first().alias("time_zone") if "Time_Zone_Hours" in df.columns else pl.lit("").first().alias("time_zone")
        ])

        # Consultar pedidos auditados
        result = await db.execute(select(PickingAuditModel.order_number, PickingAuditModel.despatch_number))
        audited_pairs = {(row.order_number, row.despatch_number) for row in result.all()}

        tracking_data = []
        for row in grouped.iter_rows(named=True):
            order_num = str(row["ORDER_"] or "").strip()
            despatch_num = str(row["DESPATCH_"] or "").strip()
            if not order_num:
                continue

            tracking_data.append({
                "order_number": order_num,
                "despatch_number": despatch_num,
                "customer_code": str(row[customer_col] or "").strip(),
                "customer_name": str(row["CUSTOMER_NAME"] or "").strip(),
                "total_lines": int(row["total_lines"]),
                "print_date": str(row["print_time"] or "").strip() or datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
                "is_audited": (order_num, despatch_num) in audited_pairs
            })
            
        return ORJSONResponse(content=tracking_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/views/view_picking_audits")
async def view_picking_audits(db: AsyncSession = Depends(get_db)):
    """API: Historial de picking empacados/auditados con resumen."""
    try:
        result = await db.execute(
            select(PickingAuditModel)
            .options(selectinload(PickingAuditModel.items), selectinload(PickingAuditModel.packages_metadata))
            .order_by(PickingAuditModel.id.desc())
        )
        audits = result.scalars().unique().all()
        
        response = []
        for audit in audits:
            response.append({
                "id": audit.id,
                "order_number": audit.order_number,
                "despatch_number": audit.despatch_number,
                "customer_name": audit.customer_name,
                "customer_code": audit.customer_code,
                "username": audit.username,
                "timestamp": audit.timestamp,
                "status": audit.status,
                "packages": audit.packages or 0,
                "items": [
                    {
                        "item_code": item.item_code,
                        "description": item.description,
                        "order_line": item.order_line,
                        "qty_req": item.qty_req,
                        "qty_scan": item.qty_scan,
                        "difference": item.difference
                    }
                    for item in audit.items
                ]
            })
        return ORJSONResponse(content=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/picking/packing_list/{audit_id}")
async def get_packing_list_data(
    audit_id: int, 
    db: AsyncSession = Depends(get_db), 
    accept_language: str = Header("es")
):
    """Obtiene datos de distribución en bultos (Packing List) para impresión."""
    try:
        result = await db.execute(select(PickingAuditModel).where(PickingAuditModel.id == audit_id))
        audit = result.scalar_one_or_none()
        if not audit:
            raise HTTPException(
                status_code=404, 
                detail=get_message("audit_not_found", accept_language, audit_id=audit_id)
            )
            
        # Artículos en bultos
        result = await db.execute(
            select(PickingPackageItem)
            .where(PickingPackageItem.audit_id == audit_id)
            .order_by(PickingPackageItem.package_number, PickingPackageItem.item_code)
        )
        package_items = result.scalars().all()
        
        packages = {}
        for item in package_items:
            pkg_num = str(item.package_number)
            if pkg_num not in packages:
                packages[pkg_num] = []
            packages[pkg_num].append({
                "order_line": item.order_line or "",
                "item_code": item.item_code,
                "description": item.description or "",
                "quantity": item.qty_scan
            })
        # Dimensiones de bultos
        result_pkg = await db.execute(select(PickingPackage).where(PickingPackage.audit_id == audit_id))
        packages_dimensions = {
            str(p.package_number): {
                "length": p.length or 0.0,
                "width": p.width or 0.0,
                "height": p.height or 0.0,
                "weight": p.weight or 0.0
            }
            for p in result_pkg.scalars().all()
        }
            
        return ORJSONResponse(content={
            "order_number": audit.order_number,
            "despatch_number": audit.despatch_number,
            "customer_code": audit.customer_code or "",
            "customer_name": audit.customer_name or "N/A",
            "timestamp": audit.timestamp,
            "total_packages": audit.packages or 0,
            "packages": packages,
            "packages_dimensions": packages_dimensions
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/picking_audit/{audit_id}")
async def get_picking_audit(
    audit_id: int, 
    db: AsyncSession = Depends(get_db), 
    accept_language: str = Header("es")
):
    """Obtiene el detalle completo de una auditoría para su edición."""
    try:
        result = await db.execute(select(PickingAuditModel).where(PickingAuditModel.id == audit_id))
        audit = result.scalar_one_or_none()
        if not audit:
            raise HTTPException(
                status_code=404, 
                detail=get_message("audit_not_found", accept_language, audit_id=audit_id)
            )
            
        # Items de la auditoría
        result_items = await db.execute(select(PickingAuditItem).where(PickingAuditItem.audit_id == audit_id))
        items = result_items.scalars().all()
        
        # Asignaciones de bultos
        result_pkg_items = await db.execute(select(PickingPackageItem).where(PickingPackageItem.audit_id == audit_id))
        package_items = result_pkg_items.scalars().all()
        
        packages_assignment = {}
        for pi in package_items:
            key = f"{pi.item_code}:{pi.order_line or ''}"
            if key not in packages_assignment:
                packages_assignment[key] = {}
            packages_assignment[key][str(pi.package_number)] = pi.qty_scan
            
        # Dimensiones de bultos
        result_pkg = await db.execute(select(PickingPackage).where(PickingPackage.audit_id == audit_id))
        packages_dimensions = [
            {
                "package_number": pd.package_number,
                "length": pd.length or 0.0,
                "width": pd.width or 0.0,
                "height": pd.height or 0.0,
                "weight": pd.weight or 0.0
            }
            for pd in result_pkg.scalars().all()
        ]
        
        return ORJSONResponse(content={
            "id": audit.id,
            "order_number": audit.order_number,
            "despatch_number": audit.despatch_number,
            "customer_code": audit.customer_code,
            "customer_name": audit.customer_name,
            "packages": audit.packages or 0,
            "packages_assignment": packages_assignment,
            "packages_dimensions": packages_dimensions,
            "items": [
                {
                    "item_code": item.item_code,
                    "description": item.description,
                    "order_line": item.order_line,
                    "qty_req": item.qty_req,
                    "qty_scan": item.qty_scan,
                    "edited": item.edited or 0
                }
                for item in items
            ]
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save_picking_audit", status_code=201)
async def save_picking_audit(
    audit_data: PickingAuditCreate, 
    db: AsyncSession = Depends(get_db), 
    accept_language: str = Header("es")
):
    """Guarda una nueva auditoría en la base de datos."""
    try:
        # Registrar auditoría principal
        new_audit = PickingAuditModel(
            order_number=audit_data.order_number.strip(),
            despatch_number=audit_data.despatch_number.strip(),
            customer_code=audit_data.customer_code.strip() if audit_data.customer_code else None,
            customer_name=audit_data.customer_name.strip() if audit_data.customer_name else "N/A",
            username=audit_data.username.strip(),
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
            status=audit_data.status,
            packages=audit_data.packages or 0
        )
        db.add(new_audit)
        await db.flush() # Obtener ID auto-generado
        
        # Registrar ítems
        for item in audit_data.items:
            difference = item.qty_scan - item.qty_req
            new_item = PickingAuditItem(
                audit_id=new_audit.id,
                item_code=item.code,
                description=item.description,
                order_line=item.order_line or '',
                qty_req=item.qty_req,
                qty_scan=item.qty_scan,
                difference=difference,
                edited=0
            )
            db.add(new_item)
            
        # Registrar dimensiones de bultos
        if audit_data.packages_dimensions:
            for dim in audit_data.packages_dimensions:
                new_pkg = PickingPackage(
                    audit_id=new_audit.id,
                    package_number=dim.package_number,
                    length=dim.length,
                    width=dim.width,
                    height=dim.height,
                    weight=dim.weight
                )
                db.add(new_pkg)
                
        # Registrar asignación de bultos
        if audit_data.packages_assignment:
            for key, assignments in audit_data.packages_assignment.items():
                if ":" in key:
                    item_code, order_line = key.split(":", 1)
                else:
                    item_code, order_line = key, ""
                    
                # Obtener descripción
                desc = ""
                for i in audit_data.items:
                    if i.code == item_code and (not order_line or i.order_line == order_line):
                        desc = i.description
                        break
                        
                for pkg_num, qty in assignments.items():
                    if qty > 0:
                        new_pkg_item = PickingPackageItem(
                            audit_id=new_audit.id,
                            package_number=int(pkg_num),
                            item_code=item_code,
                            description=desc,
                            order_line=order_line,
                            qty_scan=qty
                        )
                        db.add(new_pkg_item)
                        
        await db.commit()
        return {
            "message": get_message("audit_saved", accept_language), 
            "audit_id": new_audit.id
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/update_picking_audit/{audit_id}")
async def update_picking_audit(
    audit_id: int, 
    audit_data: PickingAuditCreate, 
    db: AsyncSession = Depends(get_db), 
    accept_language: str = Header("es")
):
    """Actualiza una auditoría existente en caliente (edición)."""
    try:
        result = await db.execute(select(PickingAuditModel).where(PickingAuditModel.id == audit_id))
        existing_audit = result.scalar_one_or_none()
        if not existing_audit:
            raise HTTPException(
                status_code=404, 
                detail=get_message("audit_not_found", accept_language, audit_id=audit_id)
            )
            
        # Determinar nuevo estado
        has_diff = any(item.qty_scan != item.qty_req for item in audit_data.items)
        new_status = "Con Diferencia" if has_diff else "Completo"
        
        # Actualizar campos de la orden
        existing_audit.status = new_status
        existing_audit.packages = audit_data.packages or 0
        existing_audit.timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')
        
        # Actualizar ítems
        for item in audit_data.items:
            res_item = await db.execute(
                select(PickingAuditItem).where(
                    and_(
                        PickingAuditItem.audit_id == audit_id,
                        PickingAuditItem.item_code == item.code,
                        PickingAuditItem.order_line == (item.order_line or '')
                    )
                )
            )
            db_item = res_item.scalar_one_or_none()
            if db_item:
                db_item.qty_scan = item.qty_scan
                db_item.difference = item.qty_scan - item.qty_req
                db_item.edited = 1
                
        # Limpiar y regenerar dimensiones
        await db.execute(delete(PickingPackage).where(PickingPackage.audit_id == audit_id))
        if audit_data.packages_dimensions:
            for dim in audit_data.packages_dimensions:
                new_pkg = PickingPackage(
                    audit_id=audit_id,
                    package_number=dim.package_number,
                    length=dim.length,
                    width=dim.width,
                    height=dim.height,
                    weight=dim.weight
                )
                db.add(new_pkg)
                
        # Limpiar y regenerar asignación
        await db.execute(delete(PickingPackageItem).where(PickingPackageItem.audit_id == audit_id))
        if audit_data.packages_assignment:
            for key, assignments in audit_data.packages_assignment.items():
                if ":" in key:
                    item_code, order_line = key.split(":", 1)
                else:
                    item_code, order_line = key, ""
                    
                desc = ""
                for i in audit_data.items:
                    if i.code == item_code and (not order_line or i.order_line == order_line):
                        desc = i.description
                        break
                        
                for pkg_num, qty in assignments.items():
                    if qty > 0:
                        new_pkg_item = PickingPackageItem(
                            audit_id=audit_id,
                            package_number=int(pkg_num),
                            item_code=item_code,
                            description=desc,
                            order_line=order_line,
                            qty_scan=qty
                        )
                        db.add(new_pkg_item)
                        
        await db.commit()
        return {
            "message": get_message("audit_updated", accept_language), 
            "audit_id": audit_id, 
            "status": new_status
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
