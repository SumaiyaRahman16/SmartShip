from fastapi import APIRouter, Depends

from db.connection import get_db
from schemas.tracking import TrackingResponse
from services import tracking_service

router = APIRouter(prefix="/tracking", tags=["tracking"])


@router.get("/{tracking_number}", response_model=TrackingResponse)
def get_tracking_info(tracking_number: str, db=Depends(get_db)):
    """Public endpoint - no authentication required."""
    return tracking_service.get_tracking_info(db, tracking_number)
