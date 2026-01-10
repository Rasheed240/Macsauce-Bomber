from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any

from app.services.parse_service import ParseService
from app.core.config import settings

router = APIRouter()
parse_service = ParseService()

class ParseResponse(BaseModel):
    columns: List[str]
    data: List[Dict[str, Any]]
    total_rows: int
    preview: List[Dict[str, Any]]
    detected_email_column: str | None = None

class ValidateEmailsRequest(BaseModel):
    data: List[Dict[str, Any]]
    email_column: str

class ValidateEmailsResponse(BaseModel):
    valid_count: int
    invalid_count: int
    duplicate_count: int
    valid_emails: List[Dict[str, Any]]
    invalid_emails: List[Dict[str, Any]]
    duplicates: List[str]

class SuggestMappingsRequest(BaseModel):
    columns: List[str]
    placeholders: List[str]

class SuggestMappingsResponse(BaseModel):
    mappings: Dict[str, str]

@router.post("/csv", response_model=ParseResponse)
async def parse_csv(file: UploadFile = File(...)):
    """Parse CSV file"""
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file"
        )

    # Read file content
    content = await file.read()

    # Check file size
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    try:
        result = parse_service.parse_csv(content)

        # Detect email column
        detected_email = parse_service.detect_email_column(result["columns"])

        return ParseResponse(
            **result,
            detected_email_column=detected_email
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while parsing the file: {str(e)}"
        )

@router.post("/excel", response_model=ParseResponse)
async def parse_excel(file: UploadFile = File(...)):
    """Parse Excel file"""
    # Validate file type
    if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an Excel file (.xlsx or .xls)"
        )

    # Read file content
    content = await file.read()

    # Check file size
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    try:
        result = parse_service.parse_excel(content)

        # Detect email column
        detected_email = parse_service.detect_email_column(result["columns"])

        return ParseResponse(
            **result,
            detected_email_column=detected_email
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while parsing the file: {str(e)}"
        )

@router.post("/json", response_model=ParseResponse)
async def parse_json_file(file: UploadFile = File(...)):
    """Parse JSON file"""
    # Validate file type
    if not file.filename.endswith('.json'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a JSON file"
        )

    # Read file content
    content = await file.read()

    # Check file size
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    try:
        result = parse_service.parse_json(content)

        # Detect email column
        detected_email = parse_service.detect_email_column(result["columns"])

        return ParseResponse(
            **result,
            detected_email_column=detected_email
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while parsing the file: {str(e)}"
        )

@router.post("/validate-emails", response_model=ValidateEmailsResponse)
async def validate_emails(request: ValidateEmailsRequest):
    """Validate email addresses in data"""
    try:
        result = parse_service.validate_emails(request.data, request.email_column)
        return ValidateEmailsResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate emails: {str(e)}"
        )

@router.post("/suggest-mappings", response_model=SuggestMappingsResponse)
async def suggest_mappings(request: SuggestMappingsRequest):
    """Suggest column to placeholder mappings"""
    try:
        mappings = parse_service.suggest_column_mappings(
            request.columns,
            request.placeholders
        )
        return SuggestMappingsResponse(mappings=mappings)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to suggest mappings: {str(e)}"
        )
