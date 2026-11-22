from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import verify_service_token
from app.schemas.requests import VariationsRequest
from app.schemas.responses import VariationsResponse
from app.infrastructure.gemini.adapter import GeminiAdapter
from app.application.create_variations import CreateVariationsUseCase

router = APIRouter(prefix="/variations", tags=["Variations"])


@router.post("", response_model=VariationsResponse, dependencies=[Depends(verify_service_token)])
async def variations(req: VariationsRequest) -> VariationsResponse:
    try:
        adapter = GeminiAdapter()
        use_case = CreateVariationsUseCase(adapter)
        return use_case.execute(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "AI_PROVIDER_ERROR", "message": str(e)},
        )
