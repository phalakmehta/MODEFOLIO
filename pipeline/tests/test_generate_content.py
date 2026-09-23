import pytest
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import generate_content
from schemas import AIModel

@pytest.fixture
def mock_pending_models():
    return [
        {
            "id": "test-pending-model",
            "name": "Test Model",
            "provider": "TestProvider",
            "specs": {}
        }
    ]

@patch("generate_content.build_evidence_pack")
@patch("generate_content.generate_json")
@patch("generate_content.load_json")
@patch("generate_content.save_json")
def test_generate_content_promotes_model(mock_save, mock_load, mock_generate, mock_build):
    mock_build.return_value = "[E1] Test Evidence"
    
    def mock_load_side_effect(filename, default=None):
        if filename == "pending-models.json":
            return [
                {
                    "id": "test-pending-model",
                    "name": "Test Model",
                    "provider": "TestProvider",
                    "specs": {}
                }
            ]
        if filename == "models.json":
            return []
        return default
        
    mock_load.side_effect = mock_load_side_effect
    
    # First call is generation, second is verification
    mock_draft = MagicMock()
    mock_draft.summary = "Test summary"
    mock_draft.inPractice = MagicMock()
    mock_draft.inPractice.model_dump.return_value = {"strengths": [], "weaknesses": []}
    mock_draft.architecture = MagicMock()
    mock_draft.architecture.model_dump.return_value = {"type": "unknown", "explanation": ""}
    mock_draft.benchmarkCaveat = "Test caveat"
    mock_draft.useCaseTags = ["coding"]
    mock_draft.confidence = "high"
    mock_draft.extractedBenchmarks = []
    
    mock_wizard = MagicMock()
    mock_wizard.model_dump.return_value = {"coding": 10, "writing": 5, "research": 5, "agentic": 5, "longContext": 5, "cheapVolume": 5}
    mock_draft.wizardScores = mock_wizard
    
    mock_verify = MagicMock()
    mock_verify.flagged = False
    
    mock_generate.side_effect = [mock_draft, mock_verify]
    
    generate_content.main()
    
    # Verify save_json was called, models.json should now have 1 item, pending should have 0
    saved_calls = {call.args[0]: call.args[1] for call in mock_save.mock_calls}
    
    assert len(saved_calls["models.json"]) == 1
    assert saved_calls["models.json"][0]["id"] == "test-pending-model"
    assert len(saved_calls["pending-models.json"]) == 0
    assert saved_calls["wizard-scores.json"]["test-pending-model"]["scores"]["coding"] == 10
