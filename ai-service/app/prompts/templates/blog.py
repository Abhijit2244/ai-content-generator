from app.prompts.templates.base import BasePromptTemplate


class BlogPromptTemplate(BasePromptTemplate):
    @property
    def name(self) -> str:
        return "blog"

    def get_structure_guidelines(self, length: str) -> str:
        return (
            f"Structure as a comprehensive blog post / article suitable for a {length} read. "
            "Include an engaging hook introduction, logically ordered H2 and H3 subheadings, "
            "clear explanatory paragraphs with practical takeaways, and a thoughtful concluding summary."
        )

    def get_formatting_rules(self) -> str:
        return (
            "Use standard Markdown formatting (# Title, ## Subheadings, bullet points where beneficial). "
            "Ensure smooth transitions between sections and avoid fluff or clichés."
        )
