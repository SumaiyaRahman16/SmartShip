from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ==========================================================
# Create Hub
# ==========================================================

class CreateHubRequest(BaseModel):
    hub_name: str = Field(..., min_length=2, max_length=100)
    city: str = Field(..., min_length=2, max_length=100)
    address: Optional[str] = None


# ==========================================================
# Update Hub
# ==========================================================

class UpdateHubRequest(BaseModel):
    hub_name: Optional[str] = Field(None, min_length=2, max_length=100)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    address: Optional[str] = None


# ==========================================================
# Hub Response
# ==========================================================

class HubResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hub_id: UUID
    hub_name: str
    city: str
    address: Optional[str]
    created_at: datetime


# ==========================================================
# Hub Summary
# ==========================================================

class HubSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hub_id: UUID
    hub_name: str
    city: str


# ==========================================================
# Hub List Response
# ==========================================================

class HubListResponse(BaseModel):
    hubs: list[HubResponse]
    total: int


HubCreate = CreateHubRequest
HubOut = HubResponse
HubUpdate = UpdateHubRequest