from typing import Optional, Dict, Any, Tuple
from app.core.config import settings
from app.core.logging import logger

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class GeminiClient:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL
        self._client = None

        if self.api_key and GENAI_AVAILABLE:
            try:
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI client: {e}")
                self._client = None

    @property
    def is_configured(self) -> bool:
        return bool(self._client is not None or (self.api_key and self.api_key.strip()))

    def generate_text(self, prompt: str) -> Tuple[str, Optional[int], Optional[int]]:
        """
        Sends prompt to Gemini model with automatic fallback across supported flash models.
        Returns (generated_text, input_tokens, output_tokens).
        """
        if self._client is not None:
            models_to_try = [self.model]
            for fallback in ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]:
                if fallback not in models_to_try:
                    models_to_try.append(fallback)

            last_error = None
            for m in models_to_try:
                try:
                    response = self._client.models.generate_content(
                        model=m,
                        contents=prompt,
                    )
                    text = response.text or ""
                    input_tokens = None
                    output_tokens = None
                    if hasattr(response, "usage_metadata") and response.usage_metadata:
                        input_tokens = getattr(response.usage_metadata, "prompt_token_count", None)
                        output_tokens = getattr(response.usage_metadata, "candidates_token_count", None)

                    # Update active model name
                    self.model = m
                    return text.strip(), input_tokens, output_tokens
                except Exception as e:
                    last_error = e
                    sanitized_err = self._sanitize_error(str(e))
                    logger.warn(f"Model {m} failed: {sanitized_err}. Trying fallback if available...")

            sanitized_last = self._sanitize_error(str(last_error))
            logger.error(f"All Gemini models exhausted. Last error: {sanitized_last}")
            raise RuntimeError(f"Gemini API error: {sanitized_last}")

        if not self.api_key:
            logger.info("No GEMINI_API_KEY detected. Running in mock demonstration mode.")
            mock_text = self._generate_mock_response(prompt)
            return mock_text, 150, 420

        raise RuntimeError("Gemini client configuration error")

    def _sanitize_error(self, err_msg: str) -> str:
        """Removes API keys or authorization secrets from error messages."""
        if not err_msg:
            return ""
        if self.api_key and self.api_key in err_msg:
            err_msg = err_msg.replace(self.api_key, "[REDACTED_API_KEY]")
        import re
        return re.sub(r"AIza[0-9A-Za-z-_]{35}", "[REDACTED_KEY]", err_msg)

    def _generate_mock_response(self, prompt: str) -> str:
        """Fallback mock generator for local testing when no API key is provided."""
        if "===VARIATION_BREAK===" in prompt:
            return (
                "Option 1: A bold, narrative-driven exploration focused on tangible real-world impact.\n\n"
                "===VARIATION_BREAK===\n\n"
                "Option 2: An analytical, data-centric perspective breaking down core mechanics.\n\n"
                "===VARIATION_BREAK===\n\n"
                "Option 3: A conversational, empathetic takeaway connecting directly with daily experience."
            )
        elif "PRIMARY GOAL: SIMPLIFY" in prompt:
            return "Here is a simplified version of your text. The language is clear, friendly, and easy to understand for any reader without technical jargon."
        elif "PRIMARY GOAL: SHORTEN" in prompt:
            return "This condensed summary delivers the essential takeaway directly and succinctly, removing all unnecessary filler."
        elif "PRIMARY GOAL: EXPAND" in prompt:
            return "Here is an expanded draft providing in-depth analysis, comprehensive background context, practical illustrations, and actionable strategic takeaways."
        elif "PRIMARY GOAL:" in prompt:
            return "Here is the refined content, polished to ensure superior flow, clear structure, and flawless grammar."
        else:
            return (
                "# Comprehensive Overview\n\n"
                "Content generation is transforming how teams communicate, collaborate, and share knowledge. "
                "By pairing structured thinking with cutting-edge language models, modern applications enable writers "
                "to produce compelling drafts in seconds.\n\n"
                "## Key Insights\n"
                "- Structured prompts maintain consistency and tone.\n"
                "- Iterative refinement ensures precision and human voice.\n"
                "- Version tracking preserves creative exploration without losing earlier drafts.\n\n"
                "## Conclusion\n"
                "As tools evolve, the role of the writer shifts toward high-level strategy, curation, and refined storytelling."
            )
