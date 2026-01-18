import smtplib
from email.mime.text import MIMEText
from typing import List
import asyncio
from app.config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    CONTACT_EMAILS,
)
from app.utils.logging import setup_logger

logger = setup_logger(__name__)


def _send_contact_email_sync(
    name: str, email: str, message: str, recipients: List[str]
) -> bool:
    """
    Synchronous function to send contact form email via SMTP.
    Returns True on success, False on failure.
    """
    if not SMTP_HOST or not SMTP_FROM or not recipients:
        logger.warning(
            "SMTP configuration incomplete. Cannot send contact email."
        )
        return False

    subject = f"Contact Form Submission from {name}"
    body = f"""
Name: {name}
Email: {email}

Message:
{message}
"""

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = ", ".join(recipients)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as smtp:
            try:
                smtp.starttls()
            except Exception:
                pass
            if SMTP_USER and SMTP_PASS:
                try:
                    smtp.login(SMTP_USER, SMTP_PASS)
                except Exception:
                    pass
            smtp.sendmail(SMTP_FROM, recipients, msg.as_string())
        logger.info(f"Contact email sent successfully to {recipients}")
        return True
    except Exception as e:
        logger.error(f"Failed to send contact email: {e}")
        return False


async def send_contact_email(name: str, email: str, message: str) -> bool:
    """
    Async wrapper to send contact form email in a background thread.
    Returns True on success, False on failure.
    """
    if not CONTACT_EMAILS:
        logger.warning("No contact email recipients configured")
        return False

    try:
        result = await asyncio.to_thread(
            _send_contact_email_sync, name, email, message, CONTACT_EMAILS
        )
        return result
    except Exception as e:
        logger.error(f"Error in async contact email sending: {e}")
        return False
