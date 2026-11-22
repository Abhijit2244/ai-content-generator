import secrets
from fastapi import Header, HTTPException, status
from app.core.config import settings


async def verify_service_token(authorization: str = Header(None)) -> str:
    """
    Validates internal service-to-service token between Node.js backend and FastAPI service.
    Uses constant-time comparison to prevent timing side-channel attacks.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed service authorization header",
        )

    token = authorization.split(" ", 1)[1].strip()
    if not secrets.compare_digest(token, settings.AI_SERVICE_TOKEN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid service credentials",
        )

    return token
