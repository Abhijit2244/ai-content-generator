from app.prompts.templates.base import BasePromptTemplate


class MarketingPromptTemplate(BasePromptTemplate):
    @property
    def name(self) -> str:
        return "marketing"

    def get_structure_guidelines(self, length: str) -> str:
        return (
            "Format as high-converting marketing / advertising copy. Use a classic persuasive copywriting framework "
            "(such as AIDA: Attention, Interest, Desire, Action, or PAS: Problem, Agitate, Solve). "
            "Highlight core value propositions, customer benefits over mere features, and a compelling Call-to-Action (CTA)."
        )

    def get_formatting_rules(self) -> str:
        return (
            "Use power words, persuasive headlines, clear benefit bullet points, and an unmistakable, prominent CTA."
        )
