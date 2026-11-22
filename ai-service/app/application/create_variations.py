from app.schemas.requests import VariationsRequest
from app.schemas.responses import VariationsResponse
from app.prompts.variations import build_variations_prompt
from app.infrastructure.gemini.adapter import GeminiAdapter


class CreateVariationsUseCase:
    def __init__(self, adapter: GeminiAdapter):
        self.adapter = adapter

    def execute(self, req: VariationsRequest) -> VariationsResponse:
        prompt = build_variations_prompt(req)
        variations, model = self.adapter.generate_variations(prompt, req.count)
        return VariationsResponse(
            variations=variations,
            model=model,
        )
