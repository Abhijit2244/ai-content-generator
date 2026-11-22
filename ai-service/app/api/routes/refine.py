from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import verify_service_token
from app.schemas.requests import RefineRequest
from app.schemas.responses import RefineResponse
from app.infrastructure.gemini.adapter import GeminiAdapter
from app.application.refine_content import RefineContentUseCase

router = APIRouter(prefix="/refine", tags=["Refinement"])


@router.post("", response_model=RefineResponse, dependencies=[Depends(verify_service_token)])
async def refine(req: RefineRequest) -> RefineResponse:
    try:
        adapter = GeminiAdapter()
        use_case = RefineContentUseCase(adapter)
        return use_case.execute(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "AI_PROVIDER_ERROR", "message": str(e)},
        )
