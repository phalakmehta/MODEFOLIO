import pytest
from unittest.mock import patch
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import build_news
from schemas import NewsDigest, NewsItem

@pytest.fixture
def mock_candidates():
    return [
        {
            "title": "GPT-5 Released",
            "url": "https://example.com/gpt5",
            "source": "Hacker News",
            "publishedAt": "2026-09-23T00:00:00Z",
            "snippet": "OpenAI announces new model.",
            "score": 1500
        },
        {
            "title": "Claude 3.5 Sonnet is fast",
            "url": "https://example.com/claude",
            "source": "Anthropic Blog",
            "publishedAt": "2026-09-22T00:00:00Z",
            "snippet": "New speeds.",
            "score": 1000
        }
    ]

@patch("build_news.search_hn")
@patch("build_news.fetch_rss_feeds")
@patch("build_news.generate_json")
@patch("build_news.load_json")
@patch("build_news.save_json")
def test_build_news_drops_hallucinated_urls(mock_save, mock_load, mock_generate, mock_rss, mock_hn, mock_candidates):
    mock_hn.return_value = mock_candidates[:1]
    mock_rss.return_value = mock_candidates[1:]
    
    def mock_load_side_effect(filename, default=None):
        if filename == "models.json":
            return [{"id": "gpt-5", "name": "GPT-5", "provider": "OpenAI"}]
        return default
        
    mock_load.side_effect = mock_load_side_effect
    
    # Mock LLM returns one valid URL, one hallucinated URL
    mock_digest = NewsDigest(
        weekOf="2026-09-16",
        generatedAt="2026-09-23T00:00:00Z",
        model="test-model",
        items=[
            NewsItem(
                headline="Valid News", summary="Valid", whyItMatters="Valid", 
                modelIds=["gpt-5"], sourceName="HN", 
                sourceUrl="https://example.com/gpt5", publishedAt="2026-09-23T00:00:00Z"
            ),
            NewsItem(
                headline="Hallucinated News", summary="Fake", whyItMatters="Fake", 
                modelIds=[], sourceName="Fake", 
                sourceUrl="https://hallucinated.com/fake", publishedAt="2026-09-23T00:00:00Z"
            )
        ]
    )
    mock_generate.return_value = mock_digest
    
    # Run the process
    try:
        build_news.main()
    except SystemExit:
        pass # Expected to exit 1 because it drops the hallucinated URL and falls below the minimum 3 items
        
    # Verify the hallucinated URL caused it to fail instead of saving bad data
    mock_save.assert_not_called()
