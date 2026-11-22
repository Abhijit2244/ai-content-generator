from enum import Enum


class ContentType(str, Enum):
    BLOG = "blog"
    SOCIAL_LINKEDIN = "social_linkedin"
    SOCIAL_INSTAGRAM = "social_instagram"
    SOCIAL_X = "social_x"
    EMAIL = "email"
    MARKETING = "marketing"
    PRODUCT_DESCRIPTION = "product_description"
    STUDY_NOTES = "study_notes"
    REPORT = "report"
    CREATIVE_WRITING = "creative_writing"


class Tone(str, Enum):
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    FRIENDLY = "friendly"
    PERSUASIVE = "persuasive"
    INFORMATIVE = "informative"
    CREATIVE = "creative"
    HUMOROUS = "humorous"
    ACADEMIC = "academic"


class ContentLength(str, Enum):
    SHORT = "short"
    MEDIUM = "medium"
    LONG = "long"


class RefineAction(str, Enum):
    REWRITE = "rewrite"
    IMPROVE_GRAMMAR = "improve_grammar"
    SIMPLIFY = "simplify"
    EXPAND = "expand"
    SHORTEN = "shorten"
    CHANGE_TONE = "change_tone"
    IMPROVE_READABILITY = "improve_readability"
