import pandas as pd
import json
from typing import List, Dict, Any
from email_validator import validate_email, EmailNotValidError
import io

class ParseService:
    @staticmethod
    def parse_csv(file_content: bytes) -> Dict[str, Any]:
        """Parse CSV file and return structured data"""
        try:
            # Read CSV using pandas
            df = pd.read_csv(io.BytesIO(file_content))

            # Get column names
            columns = df.columns.tolist()

            # Convert to list of dictionaries
            data = df.to_dict('records')

            # Clean data - replace NaN with empty strings
            for row in data:
                for key, value in row.items():
                    if pd.isna(value):
                        row[key] = ""

            return {
                "columns": columns,
                "data": data,
                "total_rows": len(data),
                "preview": data[:10]  # First 10 rows for preview
            }

        except Exception as e:
            raise ValueError(f"Failed to parse CSV: {str(e)}")

    @staticmethod
    def parse_excel(file_content: bytes) -> Dict[str, Any]:
        """Parse Excel file and return structured data"""
        try:
            # Read Excel using pandas
            df = pd.read_excel(io.BytesIO(file_content))

            # Get column names
            columns = df.columns.tolist()

            # Convert to list of dictionaries
            data = df.to_dict('records')

            # Clean data - replace NaN with empty strings
            for row in data:
                for key, value in row.items():
                    if pd.isna(value):
                        row[key] = ""

            return {
                "columns": columns,
                "data": data,
                "total_rows": len(data),
                "preview": data[:10]
            }

        except Exception as e:
            raise ValueError(f"Failed to parse Excel: {str(e)}")

    @staticmethod
    def parse_json(file_content: bytes) -> Dict[str, Any]:
        """Parse JSON file and return structured data"""
        try:
            # Parse JSON
            data = json.loads(file_content.decode('utf-8'))

            # Ensure data is a list
            if not isinstance(data, list):
                raise ValueError("JSON must be an array of objects")

            if len(data) == 0:
                raise ValueError("JSON array is empty")

            # Get column names from first object
            columns = list(data[0].keys())

            return {
                "columns": columns,
                "data": data,
                "total_rows": len(data),
                "preview": data[:10]
            }

        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")
        except Exception as e:
            raise ValueError(f"Failed to parse JSON: {str(e)}")

    @staticmethod
    def validate_emails(data: List[Dict[str, Any]], email_column: str) -> Dict[str, Any]:
        """Validate email addresses in data"""
        valid_emails = []
        invalid_emails = []
        duplicates = set()
        seen_emails = set()

        for row in data:
            email = str(row.get(email_column, "")).strip()

            if not email:
                invalid_emails.append({
                    "email": email,
                    "reason": "Empty email address",
                    "row": row
                })
                continue

            # Check for duplicates
            if email.lower() in seen_emails:
                duplicates.add(email.lower())
                continue

            # Validate email format
            try:
                validated = validate_email(email, check_deliverability=False)
                valid_emails.append({
                    "email": validated.normalized,
                    "original": email,
                    "row": row
                })
                seen_emails.add(email.lower())
            except EmailNotValidError as e:
                invalid_emails.append({
                    "email": email,
                    "reason": str(e),
                    "row": row
                })

        return {
            "valid_count": len(valid_emails),
            "invalid_count": len(invalid_emails),
            "duplicate_count": len(duplicates),
            "valid_emails": valid_emails,
            "invalid_emails": invalid_emails,
            "duplicates": list(duplicates)
        }

    @staticmethod
    def detect_email_column(columns: List[str]) -> str | None:
        """Auto-detect which column contains email addresses"""
        email_keywords = ['email', 'e-mail', 'mail', 'address', 'contact']

        for col in columns:
            col_lower = col.lower()
            if any(keyword in col_lower for keyword in email_keywords):
                return col

        return None

    @staticmethod
    def suggest_column_mappings(columns: List[str], placeholders: List[str]) -> Dict[str, str]:
        """Suggest mappings between columns and placeholders"""
        mappings = {}

        # Normalize for comparison
        def normalize(s: str) -> str:
            return s.lower().replace('_', '').replace('-', '').replace(' ', '')

        for placeholder in placeholders:
            normalized_placeholder = normalize(placeholder)

            # Find best matching column
            for col in columns:
                normalized_col = normalize(col)

                if normalized_placeholder == normalized_col:
                    mappings[placeholder] = col
                    break
                elif normalized_placeholder in normalized_col or normalized_col in normalized_placeholder:
                    if placeholder not in mappings:
                        mappings[placeholder] = col

        return mappings

    @staticmethod
    def remove_duplicates(data: List[Dict[str, Any]], email_column: str) -> List[Dict[str, Any]]:
        """Remove duplicate email addresses"""
        seen = set()
        unique_data = []

        for row in data:
            email = str(row.get(email_column, "")).strip().lower()
            if email and email not in seen:
                seen.add(email)
                unique_data.append(row)

        return unique_data
