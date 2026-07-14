from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ==========================================================
# Create Shipment
# ==========================================================

class CreateShipmentRequest(BaseModel):
    tracking_number: str = Field(..., max_length=50)

    sender_name: str = Field(..., min_length=2, max_length=100)
    sender_phone: Optional[str] = Field(None, max_length=20)

    receiver_name: str = Field(..., min_length=2, max_length=100)
    receiver_phone: Optional[str] = Field(None, max_length=20)

    delivery_address: str

    origin_hub_id: UUID
    destination_hub_id: UUID

    expected_delivery_date: Optional[date] = None


# ==========================================================
# Update Shipment
# ==========================================================

class UpdateShipmentRequest(BaseModel):
    sender_name: Optional[str] = Field(None, min_length=2, max_length=100)
    sender_phone: Optional[str] = Field(None, max_length=20)

    receiver_name: Optional[str] = Field(None, min_length=2, max_length=100)
    receiver_phone: Optional[str] = Field(None, max_length=20)

    delivery_address: Optional[str] = None

    origin_hub_id: Optional[UUID] = None
    destination_hub_id: Optional[UUID] = None

    expected_delivery_date: Optional[date] = None


# ==========================================================
# Shipment Response
# ==========================================================

class ShipmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    shipment_id: UUID
    tracking_number: str

    sender_name: str
    sender_phone: Optional[str]

    receiver_name: str
    receiver_phone: Optional[str]

    delivery_address: str

    origin_hub_id: UUID
    destination_hub_id: UUID

    expected_delivery_date: Optional[date]

    created_by: UUID
    created_at: datetime


# ==========================================================
# Shipment Summary
# ==========================================================

class ShipmentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    shipment_id: UUID
    tracking_number: str

    sender_name: str
    receiver_name: str

    created_at: datetime


# ==========================================================
# Shipment List Response
# ==========================================================

class ShipmentListResponse(BaseModel):
    shipments: list[ShipmentSummary]
    total: int


ShipmentCreate = CreateShipmentRequest
ShipmentOut = ShipmentResponse
ShipmentUpdate = UpdateShipmentRequest