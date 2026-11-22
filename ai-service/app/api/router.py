from fastapi import APIRouter
from app.api.routes import generate, refine, variations, health

api_router = APIRouter()

# Internal v1 endpoints
internal_v1 = APIRouter(prefix="/internal/v1")
internal_v1.include_router(generate.router)
internal_v1.include_router(refine.router)
internal_v1.include_router(variations.router)

api_router.include_router(internal_v1)
api_router.include_router(health.router)
