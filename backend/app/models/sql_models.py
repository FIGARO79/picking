import datetime
from typing import Optional, List
from sqlalchemy import Integer, String, Float, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

class PickingAudit(Base):
    __tablename__ = "picking_audits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_number: Mapped[str] = mapped_column(String(100), nullable=False)
    despatch_number: Mapped[str] = mapped_column(String(100), nullable=False)
    customer_name: Mapped[Optional[str]] = mapped_column(String(255))
    customer_code: Mapped[Optional[str]] = mapped_column(String(100))
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    timestamp: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    packages: Mapped[Optional[int]] = mapped_column(Integer, default=0)

    items = relationship("PickingAuditItem", back_populates="audit", cascade="all, delete-orphan")
    package_items = relationship("PickingPackageItem", back_populates="audit", cascade="all, delete-orphan")
    packages_metadata = relationship("PickingPackage", back_populates="audit", cascade="all, delete-orphan")
    shipment_links = relationship("ShipmentAudit", back_populates="audit")

class PickingAuditItem(Base):
    __tablename__ = "picking_audit_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    audit_id: Mapped[int] = mapped_column(Integer, ForeignKey("picking_audits.id"), nullable=False, index=True)
    item_code: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255))
    order_line: Mapped[Optional[str]] = mapped_column(String(50))
    qty_req: Mapped[int] = mapped_column(Integer, nullable=False)
    qty_scan: Mapped[int] = mapped_column(Integer, nullable=False)
    difference: Mapped[int] = mapped_column(Integer, nullable=False)
    edited: Mapped[Optional[int]] = mapped_column(Integer, default=0)

    audit = relationship("PickingAudit", back_populates="items")

class PickingPackageItem(Base):
    __tablename__ = "picking_package_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    audit_id: Mapped[int] = mapped_column(Integer, ForeignKey("picking_audits.id"), nullable=False, index=True)
    package_number: Mapped[int] = mapped_column(Integer, nullable=False)
    order_line: Mapped[Optional[str]] = mapped_column(String(50))
    item_code: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255))
    qty_scan: Mapped[int] = mapped_column(Integer, nullable=False)

    audit = relationship("PickingAudit", back_populates="package_items")

class PickingPackage(Base):
    __tablename__ = "picking_packages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    audit_id: Mapped[int] = mapped_column(Integer, ForeignKey("picking_audits.id"), nullable=False, index=True)
    package_number: Mapped[int] = mapped_column(Integer, nullable=False)
    length: Mapped[Optional[float]] = mapped_column(Float, default=0.0)
    width: Mapped[Optional[float]] = mapped_column(Float, default=0.0)
    height: Mapped[Optional[float]] = mapped_column(Float, default=0.0)
    weight: Mapped[Optional[float]] = mapped_column(Float, default=0.0)

    audit = relationship("PickingAudit", back_populates="packages_metadata")

class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[str] = mapped_column(String(50), nullable=False,
        default=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    note: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    carrier: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")

    audit_links = relationship("ShipmentAudit", back_populates="shipment", cascade="all, delete-orphan")

class ShipmentAudit(Base):
    __tablename__ = "shipment_audits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    shipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("shipments.id"), nullable=False, index=True)
    audit_id: Mapped[int] = mapped_column(Integer, ForeignKey("picking_audits.id"), nullable=False, index=True)

    shipment = relationship("Shipment", back_populates="audit_links")
    audit = relationship("PickingAudit", back_populates="shipment_links")
