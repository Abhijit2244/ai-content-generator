from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import verify_service_token
from app.schemas.requests import GenerateRequest
from app.schemas.responses import GenerateResponse
from app.infrastructure.gemini.adapter import GeminiAdapter
from app.application.generate_content import GenerateContentUseCase

router = APIRouter(prefix="/generate", tags=["Generation"])


@router.post("", response_model=GenerateResponse, dependencies=[Depends(verify_service_token)])
async def generate(req: GenerateRequest) -> GenerateResponse:
    try:
        adapter = GeminiAdapter()
        use_case = GenerateContentUseCase(adapter)
        return use_case.execute(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "AI_PROVIDER_ERROR", "message": str(e)},
        )
