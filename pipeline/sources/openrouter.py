import httpx
import time
from typing import List, Dict, Any

def fetch_openrouter_models() -> List[Dict[str, Any]]:
    """
    Fetches the list of models from OpenRouter API.
    Retries up to 3 times with exponential backoff on failure.
    """
    url = "https://openrouter.ai/api/v1/models"
    headers = {
        "User-Agent": "Modelfolio-Backend-Bot/1.0",
    }
    timeout = httpx.Timeout(30.0)
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                return data.get("data", [])
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            if attempt == max_retries - 1:
                print(f"Failed to fetch OpenRouter models after {max_retries} attempts: {e}")
                raise
            sleep_time = 2 ** attempt
            print(f"OpenRouter fetch failed: {e}. Retrying in {sleep_time} seconds...")
            time.sleep(sleep_time)
            
    return []
