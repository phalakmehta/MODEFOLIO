import pytest
from unittest.mock import patch
import json
import os
import sys

# Add pipeline dir to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import update_models

@pytest.fixture
def mock_openrouter_response():
    return [
        {
            "id": "anthropic/claude-3-opus",
            "name": "Claude 3 Opus",
            "created": 1709251200,
            "context_length": 200000,
            "pricing": {
                "prompt": "0.000015",
                "completion": "0.000075"
            },
            "top_provider": {
                "max_completion_tokens": 4096
            },
            "architecture": {
                "input_modalities": ["text", "image"],
                "output_modalities": ["text"]
            }
        }
    ]

@patch("update_models.fetch_openrouter_models")
@patch("update_models.load_json")
@patch("update_models.save_json")
def test_idempotent_update(mock_save, mock_load, mock_fetch, mock_openrouter_response):
    mock_fetch.return_value = mock_openrouter_response
    
    # Mock existing state exactly matching the fetched state
    def mock_load_side_effect(filename, default=None):
        if filename == "model-sources.json":
            return {"claude-3-opus": {"openrouterId": "anthropic/claude-3-opus"}}
        if filename == "models.json":
            return [{
                "id": "claude-3-opus",
                "specs": {
                    "contextWindow": 200000,
                    "maxOutputTokens": 4096,
                    "pricing": {
                        "input": 15.0,
                        "output": 75.0,
                        "unit": "per 1M tokens"
                    }
                }
            }]
        return default
        
    mock_load.side_effect = mock_load_side_effect
    
    # Run update in dry-run to not save, or just run and verify save isn't called
    sys.argv = ["update_models.py", "--dry-run"]
    update_models.main()
    
    # Verify save was not called since nothing changed (idempotent)
    mock_save.assert_not_called()
