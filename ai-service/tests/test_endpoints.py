from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

AUTH_HEADER = {"Authorization": f"Bearer {settings.AI_SERVICE_TOKEN}"}


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ai-service"


def test_internal_generate_unauthorized():
    payload = {
        "title": "Test Title",
        "contentType": "blog",
        "tone": "informative",
        "length": "medium",
    }
    # No auth header
    response = client.post("/internal/v1/generate", json=payload)
    assert response.status_code == 401

    # Wrong token
    response_wrong = client.post(
        "/internal/v1/generate",
        json=payload,
        headers={"Authorization": "Bearer wrong-token"},
    )
    assert response_wrong.status_code == 403


def test_internal_generate_authorized():
    payload = {
        "title": "Machine Learning Foundations",
        "contentType": "blog",
        "tone": "informative",
        "length": "medium",
        "keywords": ["AI", "Algorithms"],
    }
    response = client.post(
        "/internal/v1/generate",
        json=payload,
        headers=AUTH_HEADER,
    )
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert "content" in data
    assert len(data["content"]) > 10
    assert data["model"] is not None


def test_internal_refine_authorized():
    payload = {
        "content": "A draft text that needs to be simplified.",
        "action": "simplify",
        "instruction": "Use elementary terms.",
    }
    response = client.post(
        "/internal/v1/refine",
        json=payload,
        headers=AUTH_HEADER,
    )
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert data["action"] == "simplify"


def test_internal_variations_authorized():
    payload = {
        "title": "Launch Announcement",
        "content": "We are proud to announce our product launch today.",
        "contentType": "marketing",
        "tone": "persuasive",
        "count": 3,
    }
    response = client.post(
        "/internal/v1/variations",
        json=payload,
        headers=AUTH_HEADER,
    )
    assert response.status_code == 200
    data = response.json()
    assert "variations" in data
    assert len(data["variations"]) >= 1


def test_internal_generate_validation_error_returns_422():
    # Missing required field 'contentType'
    payload = {
        "title": "Incomplete Payload",
        "tone": "informative",
        "length": "medium",
    }
    response = client.post("/internal/v1/generate", json=payload, headers=AUTH_HEADER)
    assert response.status_code == 422


def test_internal_refine_unauthorized():
    payload = {
        "content": "Sample content to simplify.",
        "action": "simplify",
    }
    response = client.post("/internal/v1/refine", json=payload)
    assert response.status_code == 401

    response_bad_token = client.post(
        "/internal/v1/refine",
        json=payload,
        headers={"Authorization": "Bearer bad-token-xyz"},
    )
    assert response_bad_token.status_code == 403


def test_internal_refine_invalid_action_returns_422():
    payload = {
        "content": "Sample content to simplify.",
        "action": "invalid_unknown_action",
    }
    response = client.post("/internal/v1/refine", json=payload, headers=AUTH_HEADER)
    assert response.status_code == 422


def test_internal_variations_unauthorized():
    payload = {
        "title": "Variations Subject",
        "content": "Original content",
        "contentType": "blog",
        "tone": "informative",
        "count": 3,
    }
    response = client.post("/internal/v1/variations", json=payload)
    assert response.status_code == 401


def test_internal_variations_out_of_bounds_count_returns_422():
    payload = {
        "title": "Variations Subject",
        "content": "Original content",
        "contentType": "blog",
        "tone": "informative",
        "count": 99,  # exceeds allowed le=3
    }
    response = client.post("/internal/v1/variations", json=payload, headers=AUTH_HEADER)
    assert response.status_code == 422

