from datetime import date, datetime
from typing import Optional
from uuid import UUID

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict


# ==========================================================
# Tracking Timeline Event
# ==========================================================

class TrackingTimelineEvent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    hub: Optional[str] = None
    remarks: Optional[str] = None
    event_time: datetime


# ==========================================================
# Public Tracking Response
# ==========================================================

class TrackingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tracking_number: str
    status: str
    current_hub: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    updated_at: datetime
    timeline: list[TrackingTimelineEvent]