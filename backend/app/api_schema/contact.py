from pydantic import BaseModel, EmailStr, Field


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Contact name")
    email: EmailStr = Field(..., description="Contact email address")
    message: str = Field(
        ..., min_length=10, max_length=5000, description="Contact message"
    )


class ContactResponse(BaseModel):
    success: bool
    message: str
