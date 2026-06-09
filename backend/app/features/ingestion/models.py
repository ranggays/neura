from pydantic import BaseModel, Field

from app.features.graph.models import NewsSource


class SourceContent(BaseModel):
    source: NewsSource
    body: str = Field(min_length=1)
    language: str = "en"
