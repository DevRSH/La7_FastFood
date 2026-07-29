from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.v1.router import api_router
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Aquí puedes agregar lógica al inicio de la app (ej. conexión extra)
    yield
    # Aquí puedes agregar lógica al cierre de la app

app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
