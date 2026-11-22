from app.prompts.templates.base import BasePromptTemplate


class ProductDescriptionPromptTemplate(BasePromptTemplate):
    @property
    def name(self) -> str:
        return "product_description"

    def get_structure_guidelines(self, length: str) -> str:
        return (
            "Format as an appealing e-commerce or product catalog description. Include: "
            "1. An inspiring product headline and overview hook. "
            "2. Key features translated into tangible everyday benefits. "
            "3. Material / specifications or use cases. "
            "4. Ideal customer persona fit and closing purchasing motivation."
        )

    def get_formatting_rules(self) -> str:
        return (
            "Use bullet points for key features and specifications. Make text scannable for online shoppers."
        )
