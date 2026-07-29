from pydantic import BaseModel, ConfigDict

class PinLogin(BaseModel):
    pin: str
    
    model_config = ConfigDict(from_attributes=True)

class PinResponse(BaseModel):
    success: bool
    message: str
    
    model_config = ConfigDict(from_attributes=True)
