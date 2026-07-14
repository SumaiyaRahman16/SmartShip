from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ==========================================================
# Tracking Timeline Event
# ==========================================================

class TrackingTimelineEvent(BaseModel):
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
# Current Shipment State
# ==========================================================

class CurrentShipmentState(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    current_status: str

    current_hub_id: UUID
    current_hub_name: str

    last_updated: datetime


# ==========================================================
# Shipment Tracking Information
# ==========================================================

class ShipmentTrackingInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    shipment_id: UUID
    tracking_number: str

    sender_name: str

    receiver_name: str

    delivery_address: str

    origin_hub: str
    destination_hub: str

    expected_delivery_date: Optional[date]


# ==========================================================
# Public Tracking Response
# ==========================================================

class TrackingResponse(BaseModel):
    shipment: ShipmentTrackingInfo

    current_state: CurrentShipmentState

    timeline: list[TrackingTimelineEvent]