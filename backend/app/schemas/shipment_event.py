from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ==========================================================
# Create Shipment Event
# ==========================================================

class CreateShipmentEventRequest(BaseModel):
    shipment_id: UUID
    hub_id: UUID
    status_id: int = Field(..., ge=1)
    remarks: Optional[str] = None


# ==========================================================
# Shipment Event Response
# ==========================================================

class ShipmentEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: UUID

    shipment_id: UUID
    hub_id: UUID
    performed_by: UUID

    status_id: int
    status_name: str

    remarks: Optional[str]

    event_time: datetime


# ==========================================================
# Timeline Event
# ==========================================================

class TimelineEvent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: UUID

    status: str

    hub_id: UUID
    hub_name: str

    performed_by: UUID
    performed_by_name: str

    remarks: Optional[str]

    event_time: datetime


# ==========================================================
# Shipment Timeline Response
# ==========================================================

class ShipmentTimelineResponse(BaseModel):
    tracking_number: str

    shipment_id: UUID

    current_status: str

    timeline: list[TimelineEvent]


ShipmentEventCreate = CreateShipmentEventRequest
ShipmentEventOut = ShipmentEventResponse