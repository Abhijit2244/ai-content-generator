from typing import List, Optional
from pydantic import BaseModel, Field
from app.domain.models import ContentType, Tone, ContentLength, RefineAction


class GenerateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    contentType: ContentType
    tone: Tone
    length: ContentLength
    targetAudience: Optional[str] = Field(default="", max_length=200)
    keywords: Optional[List[str]] = Field(default_factory=list, max_length=15)
    context: Optional[str] = Field(default="", max_length=2000)
    referenceText: Optional[str] = Field(default="", max_length=10000)


class RefineRequest(BaseModel):
    content: str = Field(..., min_length=1)
    action: RefineAction
    instruction: Optional[str] = Field(default="", max_length=1000)
    scope: Optional[str] = Field(default="full")
    selectedText: Optional[str] = None


class VariationsRequest(BaseModel):
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    contentType: str
    tone: str
    count: int = Field(default=3, ge=1, le=3)
