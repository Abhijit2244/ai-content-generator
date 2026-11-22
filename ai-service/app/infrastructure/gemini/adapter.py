from typing import List, Tuple, Optional
from app.infrastructure.gemini.client import GeminiClient
from app.schemas.responses import TokenUsage, VariationItem


class GeminiAdapter:
    def __init__(self, client: Optional[GeminiClient] = None):
        self.client = client or GeminiClient()

    def generate_content(
        self, prompt: str, default_title: str
    ) -> Tuple[str, str, str, TokenUsage]:
        text, in_tokens, out_tokens = self.client.generate_text(prompt)

        # Extract title from markdown header if available
        title = default_title
        lines = text.split("\n")
        for line in lines:
            trimmed = line.strip()
            if trimmed.startswith("# "):
                title = trimmed.replace("# ", "").strip()
                break

        usage = TokenUsage(inputTokens=in_tokens, outputTokens=out_tokens)
        return title, text, self.client.model, usage

    def refine_content(self, prompt: str, action: str) -> Tuple[str, str, str]:
        text, _, _ = self.client.generate_text(prompt)
        return text, action, self.client.model

    def generate_variations(
        self, prompt: str, requested_count: int
    ) -> Tuple[List[VariationItem], str]:
        text, _, _ = self.client.generate_text(prompt)
        raw_parts = text.split("===VARIATION_BREAK===")

        variations: List[VariationItem] = []
        for idx, part in enumerate(raw_parts[:requested_count]):
            clean_part = part.strip()
            if clean_part:
                variations.append(VariationItem(index=idx + 1, content=clean_part))

        # Fallback if split failed or model returned single response
        if not variations and text.strip():
            variations.append(VariationItem(index=1, content=text.strip()))

        return variations, self.client.model
