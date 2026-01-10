from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.template import Template
from app.models.user import User

router = APIRouter()

class CreateTemplateRequest(BaseModel):
    user_email: str
    name: str
    description: str | None = None
    subject: str
    body: str
    html_body: str | None = None
    category: str | None = None

class TemplateResponse(BaseModel):
    id: int
    name: str
    description: str | None
    subject: str
    body: str
    html_body: str | None
    category: str | None
    use_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.post("", response_model=TemplateResponse)
async def create_template(
    request: CreateTemplateRequest,
    db: Session = Depends(get_db)
):
    """Create a new template"""
    user = db.query(User).filter(User.gmail_address == request.user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    template = Template(
        user_id=user.id,
        name=request.name,
        description=request.description,
        subject=request.subject,
        body=request.body,
        html_body=request.html_body,
        category=request.category
    )

    db.add(template)
    db.commit()
    db.refresh(template)

    return template

@router.get("", response_model=List[TemplateResponse])
async def list_templates(
    user_email: str,
    category: str | None = None,
    db: Session = Depends(get_db)
):
    """List templates for a user"""
    user = db.query(User).filter(User.gmail_address == user_email).first()
    if not user:
        return []

    query = db.query(Template).filter(Template.user_id == user.id)

    if category:
        query = query.filter(Template.category == category)

    templates = query.order_by(Template.updated_at.desc()).all()

    return templates

@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific template"""
    template = db.query(Template).filter(Template.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Increment use count
    template.use_count += 1
    db.commit()

    return template

@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """Delete a template"""
    template = db.query(Template).filter(Template.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    db.delete(template)
    db.commit()

    return {"success": True, "message": "Template deleted"}
