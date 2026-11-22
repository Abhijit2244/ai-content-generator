from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.router import api_router
from app.core.config import settings
from app.core.logging import logger

app = FastAPI(
    title="AI Content Generator - AI Service",
    description="Internal Python FastAPI service integrating Google Gemini for content generation, refinement, and variation.",
    version="1.0.0",
)

# CORS configuration - restrict to local backend service and authorized origins
ALLOWED_ORIGINS = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id", "none")
    logger.info(f"Incoming {request.method} {request.url.path} [req: {request_id}]")
    try:
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        return response
    except Exception as e:
        logger.error(f"Error handling request {request.url.path}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_AI_ERROR",
                    "message": "An unexpected error occurred in the AI service.",
                },
            },
        )


app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
