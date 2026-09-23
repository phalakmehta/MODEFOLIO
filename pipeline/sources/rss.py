import feedparser
import time
from datetime import datetime, timezone
from time import mktime
from typing import List, Dict, Any

def fetch_rss_feeds(urls: List[str], start_timestamp: int) -> List[Dict[str, Any]]:
    """
    Fetch RSS feeds and return items published since start_timestamp.
    """
    results = []
    
    for url in urls:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries:
                # Try to parse published date
                published_time = 0
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    published_time = mktime(entry.published_parsed)
                elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                    published_time = mktime(entry.updated_parsed)
                    
                if published_time < start_timestamp:
                    continue
                    
                iso_date = datetime.fromtimestamp(published_time, timezone.utc).isoformat() if published_time else ""
                    
                results.append({
                    "title": entry.get("title", ""),
                    "url": entry.get("link", ""),
                    "source": feed.feed.get("title", url),
                    "publishedAt": iso_date,
                    "snippet": entry.get("summary", ""),
                    "score": 1000 # High default score for curated RSS sources
                })
        except Exception as e:
            print(f"Error fetching RSS feed '{url}': {e}")
            
    return results
