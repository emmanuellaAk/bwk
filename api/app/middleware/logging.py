import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.logger import log


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = getattr(request.state, "request_id", "-")
        start = time.perf_counter()

        log.info(
            "request",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )

        response = await call_next(request)

        ms = round((time.perf_counter() - start) * 1000, 1)
        level = "error" if response.status_code >= 500 else "warning" if response.status_code >= 400 else "info"
        getattr(log, level)(
            "response",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            ms=ms,
        )

        return response
