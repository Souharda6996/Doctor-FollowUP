import uvicorn
import os
from app.config import settings

if __name__ == "__main__":
    print(f"Starting HomeoDoc Production API on port {settings.PORT}...")
    print(f"CORS Origins: {settings.ALLOWED_ORIGINS}")
    
    uvicorn.run(
        "app.main:app", # Points to app/main.py
        host="0.0.0.0",
        port=settings.PORT,
        reload=True,
        log_level="info"
    )
