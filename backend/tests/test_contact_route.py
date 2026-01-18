import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture
def mock_send_email():
    """Mock the send_contact_email function to avoid real SMTP calls."""
    with patch("app.routes.contact.send_contact_email") as mock:
        mock.return_value = AsyncMock(return_value=True)
        yield mock


def test_contact_form_success(mock_send_email):
    """Test successful contact form submission."""
    response = client.post(
        "/contact/",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "message": "This is a test message with enough characters.",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "message" in data
    mock_send_email.assert_called_once()


def test_contact_form_validation_name_too_short():
    """Test contact form validation for name too short."""
    response = client.post(
        "/contact/",
        json={
            "name": "",
            "email": "test@example.com",
            "message": "This is a test message with enough characters.",
        },
    )

    assert response.status_code == 422


def test_contact_form_validation_email_invalid():
    """Test contact form validation for invalid email."""
    response = client.post(
        "/contact/",
        json={
            "name": "Test User",
            "email": "invalid-email",
            "message": "This is a test message with enough characters.",
        },
    )

    assert response.status_code == 422


def test_contact_form_validation_message_too_short():
    """Test contact form validation for message too short."""
    response = client.post(
        "/contact/",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "message": "Short",
        },
    )

    assert response.status_code == 422


def test_contact_form_email_send_failure():
    """Test contact form when email sending fails."""
    with patch("app.routes.contact.send_contact_email") as mock:
        mock.return_value = AsyncMock(return_value=False)

        response = client.post(
            "/contact/",
            json={
                "name": "Test User",
                "email": "test@example.com",
                "message": "This is a test message with enough characters.",
            },
        )

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
