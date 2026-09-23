import httpx

def fetch_hf_model_card(repo_id: str) -> str:
    """
    Fetches the README.md model card from Hugging Face.
    repo_id: e.g. "meta-llama/Llama-3-8b"
    """
    url = f"https://huggingface.co/{repo_id}/raw/main/README.md"
    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.get(url)
            response.raise_for_status()
            # truncate to avoid massive tokens
            return response.text[:15000] 
    except Exception as e:
        print(f"Error fetching HF model card for {repo_id}: {e}")
        return ""
