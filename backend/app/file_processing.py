import os
import fitz  # PyMuPDF
import docx

def extract_text_from_txt(file_path: str) -> str:
    """Extracts text from a .txt file."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading txt file {file_path}: {e}")
        return ""

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text from a .pdf file."""
    try:
        with fitz.open(file_path) as doc:
            text = "".join(page.get_text() for page in doc)
        return text
    except Exception as e:
        print(f"Error reading pdf file {file_path}: {e}")
        return ""

def extract_text_from_docx(file_path: str) -> str:
    """Extracts text from a .docx file."""
    try:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        print(f"Error reading docx file {file_path}: {e}")
        return ""

def extract_text(file_path: str, file_name: str) -> str:
    """Extracts text from a file based on its extension."""
    _, extension = os.path.splitext(file_name)
    extension = extension.lower()

    if extension == '.txt':
        return extract_text_from_txt(file_path)
    elif extension == '.pdf':
        return extract_text_from_pdf(file_path)
    elif extension == '.docx':
        return extract_text_from_docx(file_path)
    else:
        return "File type not supported for text extraction."
