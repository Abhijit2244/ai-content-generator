from typing import Dict
from app.domain.models import ContentType
from app.prompts.templates.base import BasePromptTemplate
from app.prompts.templates.blog import BlogPromptTemplate
from app.prompts.templates.social import SocialPostPromptTemplate
from app.prompts.templates.email import EmailPromptTemplate
from app.prompts.templates.marketing import MarketingPromptTemplate
from app.prompts.templates.product import ProductDescriptionPromptTemplate
from app.prompts.templates.study import StudyNotesPromptTemplate
from app.prompts.templates.report import ReportPromptTemplate
from app.prompts.templates.creative import CreativeWritingPromptTemplate

_STRATEGIES: Dict[str, BasePromptTemplate] = {
    ContentType.BLOG.value: BlogPromptTemplate(),
    ContentType.SOCIAL_LINKEDIN.value: SocialPostPromptTemplate("linkedin"),
    ContentType.SOCIAL_INSTAGRAM.value: SocialPostPromptTemplate("instagram"),
    ContentType.SOCIAL_X.value: SocialPostPromptTemplate("x"),
    ContentType.EMAIL.value: EmailPromptTemplate(),
    ContentType.MARKETING.value: MarketingPromptTemplate(),
    ContentType.PRODUCT_DESCRIPTION.value: ProductDescriptionPromptTemplate(),
    ContentType.STUDY_NOTES.value: StudyNotesPromptTemplate(),
    ContentType.REPORT.value: ReportPromptTemplate(),
    ContentType.CREATIVE_WRITING.value: CreativeWritingPromptTemplate(),
}


def get_prompt_strategy(content_type: ContentType | str) -> BasePromptTemplate:
    """Returns the prompt template strategy for the requested content type."""
    key = content_type.value if hasattr(content_type, "value") else str(content_type).lower()
    if key in _STRATEGIES:
        return _STRATEGIES[key]
    # Default fallback to Blog template
    return _STRATEGIES[ContentType.BLOG.value]
