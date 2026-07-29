from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import PinLogin, PinResponse
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/pin", response_model=PinResponse)
async def login_with_pin(login_data: PinLogin):
    if login_data.pin == settings.PIN_CODE:
        return PinResponse(success=True, message="PIN correcto")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="PIN incorrecto"
    )
