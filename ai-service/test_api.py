import requests

payload = {
    "pdf_base64": "JVBERi0xLg==", # fake PDF just to see if it bypasses pdf check? No, it will fail Gemini extraction
    "patient_profile": {"age": 30, "sex": "male"}
}

# Wait, Gemini extraction requires a real PDF/image, otherwise it returns an error.
