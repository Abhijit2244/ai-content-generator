from app.prompts.templates.base import BasePromptTemplate


class CreativeWritingPromptTemplate(BasePromptTemplate):
    @property
    def name(self) -> str:
        return "creative_writing"

    def get_structure_guidelines(self, length: str) -> str:
        return (
            "Structure as an immersive creative story or evocative narrative piece. "
            "Establish an engaging setting and character motivation early, build meaningful tension or exploration, "
            "and craft a resonant climax and resolution fitting the chosen length."
        )

    def get_formatting_rules(self) -> str:
        return (
            "Focus on 'show, don't tell'. Use vivid sensory details, natural dialogue cadence where appropriate, "
            "and dynamic pacing."
        )
