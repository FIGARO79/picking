import asyncio
import os
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.db import engine, AsyncSessionLocal, Base
from app.models.sql_models import PickingAudit, PickingAuditItem, PickingPackage, PickingPackageItem, Shipment, ShipmentAudit

async def main():
    print("🧹 Iniciando verificación local del flujo de base de datos...")
    
    # Asegurar que se crean las tablas
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tablas creadas con éxito.")

    async with AsyncSessionLocal() as session:
        # 1. Crear Auditoría
        audit = PickingAudit(
            order_number="0045628",
            despatch_number="00",
            customer_name="CONTINENTAL GOLD LIMITED SUCURSAL C",
            customer_code="DRP40",
            username="Fabio",
            timestamp="2026-05-28T00:00:00Z",
            status="Completo",
            packages=2
        )
        session.add(audit)
        await session.flush()
        print(f"✅ Auditoría insertada. ID temporal: {audit.id}")

        # 2. Crear Items
        item1 = PickingAuditItem(
            audit_id=audit.id,
            item_code="88601349",
            description="SAFETY CARTRIDGE",
            order_line="19",
            qty_req=2,
            qty_scan=2,
            difference=0
        )
        item2 = PickingAuditItem(
            audit_id=audit.id,
            item_code="BG00738866",
            description="MAINTENANCE KIT LH410 250H",
            order_line="22",
            qty_req=1,
            qty_scan=1,
            difference=0
        )
        session.add_all([item1, item2])

        # 3. Crear dimensiones de bultos
        pkg1 = PickingPackage(audit_id=audit.id, package_number=1, length=30, width=20, height=15, weight=1.5)
        pkg2 = PickingPackage(audit_id=audit.id, package_number=2, length=40, width=30, height=25, weight=10.5)
        session.add_all([pkg1, pkg2])

        # 4. Crear asignaciones de bultos
        assign1 = PickingPackageItem(audit_id=audit.id, package_number=1, order_line="19", item_code="88601349", description="SAFETY CARTRIDGE", qty_scan=2)
        assign2 = PickingPackageItem(audit_id=audit.id, package_number=2, order_line="22", item_code="BG00738866", description="MAINTENANCE KIT LH410 250H", qty_scan=1)
        session.add_all([assign1, assign2])

        # 5. Crear Consolidado (Shipment)
        shipment = Shipment(
            username="Fabio",
            carrier="DHL Express",
            note="Verificado y sellado",
            created_at="2026-05-28T01:00:00Z"
        )
        session.add(shipment)
        await session.flush()
        print(f"✅ Despacho consolidado insertado. ID: {shipment.id}")

        # Vincular
        link = ShipmentAudit(shipment_id=shipment.id, audit_id=audit.id)
        session.add(link)

        await session.commit()
        print("💾 Transacción confirmada.")

    # 6. Consultar y verificar relaciones
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Shipment)
            .options(selectinload(Shipment.audit_links).selectinload(ShipmentAudit.audit).selectinload(PickingAudit.items))
            .where(Shipment.id == 1)
        )
        s = result.scalars().first()
        assert s is not None
        assert len(s.audit_links) == 1
        a = s.audit_links[0].audit
        assert a.order_number == "0045628"
        assert len(a.items) == 2
        print("🎉 ¡TODO EL FLUJO Y INTEGRIDAD ORM VALIDADO CORRECTAMENTE EN SQLITE!")

if __name__ == "__main__":
    asyncio.run(main())
