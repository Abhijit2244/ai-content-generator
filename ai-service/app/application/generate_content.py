from app.schemas.requests import GenerateRequest
from app.schemas.responses import GenerateResponse
from app.prompts.builder import build_generation_prompt
from app.infrastructure.gemini.adapter import GeminiAdapter


class GenerateContentUseCase:
    def __init__(self, adapter: GeminiAdapter):
        self.adapter = adapter

    def execute(self, req: GenerateRequest) -> GenerateResponse:
        prompt = build_generation_prompt(req)
        title, content, model, usage = self.adapter.generate_content(prompt, req.title)
        return GenerateResponse(
            title=title,
            content=content,
            model=model,
            usage=usage,
        )
