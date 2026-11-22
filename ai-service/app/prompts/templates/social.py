from app.prompts.templates.base import BasePromptTemplate


class SocialPostPromptTemplate(BasePromptTemplate):
    def __init__(self, platform: str = "linkedin"):
        self.platform = platform.lower()

    @property
    def name(self) -> str:
        return f"social_{self.platform}"

    def get_structure_guidelines(self, length: str) -> str:
        if "linkedin" in self.platform:
            return (
                "Format as a high-impact LinkedIn post. Begin with a 1-2 sentence compelling hook, "
                "use generous whitespace with single-sentence paragraph breaks for mobile readability, "
                "deliver actionable professional insights or a lesson learned, and end with an open question call-to-action."
            )
        elif "instagram" in self.platform:
            return (
                "Format as an engaging Instagram caption. Start with a captivating first line that stops the scroll, "
                "tell a relatable micro-story or provide value points, use line breaks, and include a call-to-action to save, share, or comment."
            )
        elif "x" in self.platform or "twitter" in self.platform:
            return (
                "Format as a concise, punchy X (Twitter) post or concise thread structure. "
                "Prioritize clarity, strong framing, high signal-to-noise ratio, and a memorable takeaway."
            )
        return "Format as a modern, high-engagement social media update."

    def get_formatting_rules(self) -> str:
        if "linkedin" in self.platform:
            return "Include 3 to 5 targeted professional hashtags at the very bottom. Avoid excessive emojis."
        elif "instagram" in self.platform:
            return "Include relevant community hashtags (5-8) separated at the end. Use taste-level emojis for pacing."
        elif "x" in self.platform:
            return "Include 1-2 relevant hashtags. Keep statements sharp and quotable."
        return "Include appropriate hashtags and clean line breaks."
