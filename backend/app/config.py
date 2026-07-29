from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "La 7 FastFood"
    DATABASE_URL: str
    PIN_CODE: str = "1234"
    PUNTOS_POR_PESO: float = 0.01
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
