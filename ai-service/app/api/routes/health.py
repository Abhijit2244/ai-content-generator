from fastapi import APIRouter
from app.schemas.responses import HealthResponse
from app.core.config import settings
from app.infrastructure.gemini.client import GeminiClient

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    client = GeminiClient()
    return HealthResponse(
        status="healthy",
        service="ai-service",
        version="1.0.0",
        geminiConfigured=client.is_configured,
    )
