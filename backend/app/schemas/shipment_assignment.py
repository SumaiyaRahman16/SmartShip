from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ==========================================================
# Assign Rider Request
# ==========================================================

class AssignShipmentRequest(BaseModel):
    shipment_id: UUID
    rider_id: UUID


# ==========================================================
# Complete Assignment Request
# ==========================================================

class CompleteAssignmentRequest(BaseModel):
    status: str = "COMPLETED"


# ==========================================================
# Assignment Response
# ==========================================================

class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    assignment_id: UUID

    shipment_id: UUID
    tracking_number: str

    rider_id: UUID
    rider_name: str

    status: str

    assigned_at: datetime
    completed_at: Optional[datetime]


# ==========================================================
# Rider Assignment Summary
# ==========================================================

class RiderAssignmentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    assignment_id: UUID

    shipment_id: UUID
    tracking_number: str

    receiver_name: str

    delivery_address: str

    status: str

    assigned_at: datetime


# ==========================================================
# Rider Assignment List Response
# ==========================================================

class RiderAssignmentListResponse(BaseModel):
    assignments: list[RiderAssignmentSummary]
    total: int


ShipmentAssignmentCreate = AssignShipmentRequest
ShipmentAssignmentOut = AssignmentResponse