from fastapi import APIRouter
from app.api.v1 import auth, insumos, productos, utensilios, packaging, config, compras, stock, ventas, clientes, recompensas, dashboard

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(insumos.router)
api_router.include_router(productos.router)
api_router.include_router(utensilios.router)
api_router.include_router(packaging.router)
api_router.include_router(config.router)
api_router.include_router(compras.router)
api_router.include_router(stock.router)
api_router.include_router(ventas.router)
api_router.include_router(clientes.router)
api_router.include_router(recompensas.router)
api_router.include_router(dashboard.router)

@api_router.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
