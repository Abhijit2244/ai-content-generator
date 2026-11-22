from app.prompts.templates.base import BasePromptTemplate


class ReportPromptTemplate(BasePromptTemplate):
    @property
    def name(self) -> str:
        return "report"

    def get_structure_guidelines(self, length: str) -> str:
        return (
            "Format as an executive business report or formal organizational announcement. Include: "
            "1. Executive Summary (concise overview of key findings or purpose). "
            "2. Background and Context. "
            "3. Findings / Main Body with structured subheadings. "
            "4. Implications or Impact Analysis. "
            "5. Strategic Recommendations or Action Items with owners/timelines."
        )

    def get_formatting_rules(self) -> str:
        return (
            "Maintain an authoritative, objective tone. Use numbered lists for recommendations and clean markdown headings."
        )
