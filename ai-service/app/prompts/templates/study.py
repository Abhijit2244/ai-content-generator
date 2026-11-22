from app.prompts.templates.base import BasePromptTemplate


class StudyNotesPromptTemplate(BasePromptTemplate):
    @property
    def name(self) -> str:
        return "study_notes"

    def get_structure_guidelines(self, length: str) -> str:
        return (
            "Format as structured, high-retention study notes or educational summary. Include: "
            "1. Core concept definition & big picture overview. "
            "2. Key principles / foundational components broken down step-by-step. "
            "3. Concrete examples, analogies, or formulas to aid understanding. "
            "4. Common misconceptions or pitfalls to avoid. "
            "5. A quick review checklist or self-test recall questions."
        )

    def get_formatting_rules(self) -> str:
        return (
            "Use clear Markdown hierarchy, bold key terms on first mention, and use bulleted checklists."
        )
