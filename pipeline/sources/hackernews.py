import httpx
import time
from typing import List, Dict, Any

def search_hn(queries: List[str], start_timestamp: int) -> List[Dict[str, Any]]:
    """
    Search Hacker News for a list of queries since start_timestamp.
    Returns a deduplicated list of articles by URL.
    """
    results = {}
    
    timeout = httpx.Timeout(15.0)
    for query in queries:
        url = f"https://hn.algolia.com/api/v1/search_by_date?query={query}&tags=story&numericFilters=created_at_i>{start_timestamp}"
        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.get(url)
                response.raise_for_status()
                data = response.json()
                
                for hit in data.get("hits", []):
                    article_url = hit.get("url")
                    if not article_url:
                        continue
                        
                    # Standardize format to match what build_news.py expects
                    item = {
                        "title": hit.get("title", ""),
                        "url": article_url,
                        "source": "Hacker News",
                        "publishedAt": hit.get("created_at", ""),
                        "snippet": "", # HN doesn't provide snippets in search easily, use title
                        "score": hit.get("points", 0) + hit.get("num_comments", 0)
                    }
                    
                    # Deduplicate by URL
                    if article_url not in results or item["score"] > results[article_url]["score"]:
                        results[article_url] = item
                        
        except Exception as e:
            print(f"Error searching HN for '{query}': {e}")
            
        time.sleep(0.2) # Basic rate limiting
        
    return list(results.values())
