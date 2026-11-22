from typing import List, Optional
from pydantic import BaseModel


class TokenUsage(BaseModel):
    inputTokens: Optional[int] = None
    outputTokens: Optional[int] = None


class GenerateResponse(BaseModel):
    title: str
    content: str
    model: str
    usage: Optional[TokenUsage] = None


class RefineResponse(BaseModel):
    content: str
    action: str
    model: str


class VariationItem(BaseModel):
    index: int
    content: str


class VariationsResponse(BaseModel):
    variations: List[VariationItem]
    model: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    geminiConfigured: bool
