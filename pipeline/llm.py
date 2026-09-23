import os
import time
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import Type, TypeVar, Any

T = TypeVar('T', bound=BaseModel)

def generate_json(prompt: str, schema_class: Type[T], system_instruction: str = "", model_name: str = None) -> T:
    """
    Calls Gemini API and enforces a structured JSON response matching the provided Pydantic schema.
    Retries up to 2 times on failure or rate limits (429).
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is missing.")
        
    client = genai.Client(api_key=api_key)
    
    # Default model if none specified
    if not model_name:
        model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        
    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            resp = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction if system_instruction else None,
                    response_mime_type="application/json",
                    response_schema=schema_class,
                    temperature=0.2,
                ),
            )
            # Validate output matches schema
            return schema_class.model_validate_json(resp.text)
        except Exception as e:
            if attempt == max_retries:
                print(f"LLM call failed after {max_retries} retries: {e}")
                raise
            
            sleep_time = 4 ** attempt
            print(f"LLM call failed: {e}. Retrying in {sleep_time} seconds...")
            time.sleep(sleep_time)
            
    raise RuntimeError("Failed to generate JSON")
