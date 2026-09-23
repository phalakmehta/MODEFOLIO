from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

class ContentMeta(BaseModel):
    generatedAt: str
    generatedBy: str
    confidence: Literal["high", "medium", "low"]
    evidenceUrls: List[str]

class Pricing(BaseModel):
    input: float
    output: float
    unit: str = "per 1M tokens"

class Specs(BaseModel):
    contextWindow: int
    maxOutputTokens: Optional[int]
    pricing: Pricing

class InPractice(BaseModel):
    strengths: List[str]
    weaknesses: List[str]

class Architecture(BaseModel):
    type: Literal["dense", "mixture-of-experts", "unknown"]
    explanation: str

class Benchmark(BaseModel):
    name: str
    score: float

class HowToUse(BaseModel):
    docsUrl: str
    apiExample: Optional[str] = None

class ModelNewsItem(BaseModel):
    date: str
    headline: str
    url: str

class AIModel(BaseModel):
    id: str
    name: str
    provider: str
    releaseDate: str
    openSource: bool
    modality: List[str]
    summary: str
    inPractice: InPractice
    architecture: Architecture
    specs: Specs
    benchmarks: List[Benchmark] = Field(default_factory=list)
    benchmarkCaveat: str
    useCaseTags: List[str]
    howToUse: HowToUse
    news: List[ModelNewsItem] = Field(default_factory=list)
    lastUpdated: Optional[str] = None
    updateSource: Optional[str] = None
    contentMeta: Optional[ContentMeta] = None

# New News Schema
class NewsItem(BaseModel):
    headline: str = Field(max_length=90)
    summary: str
    whyItMatters: str
    modelIds: List[str]
    sourceName: str
    sourceUrl: str
    publishedAt: str

class NewsDigest(BaseModel):
    weekOf: str
    generatedAt: str
    model: str
    items: List[NewsItem]

class ChangelogEntry(BaseModel):
    date: str
    modelId: str
    type: Literal["price-change", "context-change", "max-output-change", "new-model-detected", "possibly-removed", "flagged"]
    field: Optional[str] = None
    old: Optional[Any] = None
    new: Optional[Any] = None
    source: str
    status: Literal["applied", "needs-review"]
