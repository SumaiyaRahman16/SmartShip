from datetime import datetime
from typing import Optional
from uuid import UUID

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict, Field


# ---------------------------
# Create Shipment Note
# ---------------------------

class CreateShipmentNoteRequest(BaseModel):
    shipment_id: UUID
     # tracking_number: str
    note: str = Field(..., min_length=1)

# ---------------------------
# Shipment Note Response
# ---------------------------

class ShipmentNoteResponse(BaseModel):

    note_id: UUID
    shipment_id: UUID
    user_id: UUID
    note: str
    created_at: datetime

# ShipmentNoteListResponse

class ShipmentNoteListResponse(BaseModel):
    notes: list[ShipmentNoteResponse]
    total: int


