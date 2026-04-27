import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.routes import auth, remedies, symptoms, consultations, ai, search, users

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="MediFollowUp API",
    version="2.0.0",
    description="Universal Doctor Follow-Up Platform — supports any medical specialty.",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

# Standard Response Envelope Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Routes
app.include_router(auth.router, prefix="/api")
app.include_router(remedies.router, prefix="/api")
app.include_router(symptoms.router, prefix="/api")
app.include_router(consultations.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(search.router, prefix="/api") # Note: ai/remedy-search is in here
app.include_router(users.router, prefix="/api")

@app.get("/health")
@limiter.limit("60/minute")
async def health_check(request: Request):
    return {
        "status": "ok",
        "platform": "MediFollowUp",
        "version": "2.0.0",
        "supabase": "connected",
        "firebase": "connected",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
