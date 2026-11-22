from app.prompts.templates.base import BasePromptTemplate


class EmailPromptTemplate(BasePromptTemplate):
    @property
    def name(self) -> str:
        return "email"

    def get_structure_guidelines(self, length: str) -> str:
        return (
            "Format as an effective, professional email. Include: "
            "1. A clear, high-open-rate Subject Line at the top (prefixed with 'Subject: '). "
            "2. A courteous greeting. "
            "3. An upfront statement of purpose or context. "
            "4. Well-spaced body paragraphs or bullet points explaining key details. "
            "5. A clear call to action or next steps. "
            "6. A professional sign-off and placeholder signature."
        )

    def get_formatting_rules(self) -> str:
        return (
            "Keep the subject line under 60 characters. Maintain clean paragraph breaks and "
            "ensure the tone aligns with professional workplace standards."
        )
