from fastapi import APIRouter, HTTPException, status
from app.api_schema.contact import ContactRequest, ContactResponse
from app.services.contact_email import send_contact_email
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

router = APIRouter()


@router.post("/", response_model=ContactResponse, status_code=status.HTTP_200_OK)
async def submit_contact_form(contact: ContactRequest):
    """
    Submit contact form and send email notification.
    """
    try:
        success = await send_contact_email(
            name=contact.name, email=contact.email, message=contact.message
        )

        if success:
            return ContactResponse(
                success=True, message="Thank you for your message. We'll get back to you soon."
            )
        else:
            logger.error(
                f"Failed to send contact email for {contact.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send message. Please try again later.",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing contact form: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request.",
        )
