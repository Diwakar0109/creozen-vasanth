# app/core/config.py (CORRECTED & FINAL)

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # This is for your async FastAPI application
    DATABASE_URL: str
    
    # This is for sync tools like Alembic
    SYNC_DATABASE_URL: str 
    
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()