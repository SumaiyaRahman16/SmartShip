from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class DeliveryAttemptResult(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CUSTOMER_UNAVAILABLE = "CUSTOMER_UNAVAILABLE"
    WRONG_ADDRESS = "WRONG_ADDRESS"
    REJECTED = "REJECTED"


class CreateDeliveryAttemptRequest(BaseModel):
    shipment_id: UUID
    result: DeliveryAttemptResult
    remarks: Optional[str] = None


class DeliveryAttemptResponse(BaseModel):
    attempt_id: UUID
    shipment_id: UUID
    rider_id: UUID
    result: DeliveryAttemptResult
    remarks: Optional[str] = None
    attempt_time: datetime


class DeliveryAttemptListResponse(BaseModel):
    attempts: List[DeliveryAttemptResponse]
    total: int