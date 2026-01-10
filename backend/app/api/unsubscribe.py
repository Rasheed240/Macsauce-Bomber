from fastapi import APIRouter, HTTPException, status, Request, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contact import Contact

router = APIRouter()

@router.get("/unsubscribe/{contact_id}")
def unsubscribe_get(contact_id: int, db: Session = Depends(get_db)):
    """Unsubscribe via GET request (for email links)"""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    if contact.unsubscribed:
        return {"message": "You have already unsubscribed."}
    contact.unsubscribed = True
    db.commit()
    return {"message": "You have been unsubscribed and will not receive further emails."}

@router.post("/unsubscribe/{contact_id}")
def unsubscribe_post(contact_id: int, db: Session = Depends(get_db)):
    """Unsubscribe via POST request (for frontend button)"""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    if contact.unsubscribed:
        return {"message": "You have already unsubscribed.", "success": True}
    contact.unsubscribed = True
    db.commit()
    return {"message": "You have been unsubscribed and will not receive further emails.", "success": True}
