from app.schemas.requests import RefineRequest
from app.schemas.responses import RefineResponse
from app.prompts.refinements import build_refinement_prompt
from app.infrastructure.gemini.adapter import GeminiAdapter


class RefineContentUseCase:
    def __init__(self, adapter: GeminiAdapter):
        self.adapter = adapter

    def execute(self, req: RefineRequest) -> RefineResponse:
        prompt = build_refinement_prompt(req)
        content, action, model = self.adapter.refine_content(prompt, req.action.value)
        return RefineResponse(
            content=content,
            action=action,
            model=model,
        )
