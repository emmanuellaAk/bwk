from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.config import settings
from app.database import engine
from app.errors import AppError, app_error_handler, validation_error_handler, unhandled_error_handler
from app.logger import log, setup_logging
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.logging import LoggingMiddleware
from app.routers import health, auth, clients, services, appointments


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    log.info("braider_api_starting", env=settings.env, port=settings.port)
    yield
    await engine.dispose()
    log.info("braider_api_stopped")


app = FastAPI(
    title="BraiderOS API",
    version="0.1.0",
    lifespan=lifespan,
    # Hide /docs and /redoc in production
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
)

# ── Middleware (order matters — first added = outermost) ──────────────────────

# Request ID must be first so every subsequent middleware can read it
app.add_middleware(RequestIDMiddleware)

# Structured request/response logs
app.add_middleware(LoggingMiddleware)

# CORS — restrict to the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=600,
)

# Reject requests with unexpected Host headers (basic SSRF protection)
if settings.is_production:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["api.braider.com"])

# ── Exception handlers ────────────────────────────────────────────────────────
app.add_exception_handler(AppError, app_error_handler)             # type: ignore[arg-type]
app.add_exception_handler(RequestValidationError, validation_error_handler)  # type: ignore[arg-type]
app.add_exception_handler(Exception, unhandled_error_handler)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/v1")
app.include_router(auth.router,     prefix="/v1")
app.include_router(clients.router,  prefix="/v1")
app.include_router(services.router,      prefix="/v1")
app.include_router(appointments.router,  prefix="/v1")

# Sprints 5–8 routers go here:
# app.include_router(clients.router,      prefix="/v1/clients")
# app.include_router(appointments.router, prefix="/v1/appointments")
# app.include_router(finance.router,      prefix="/v1/finance")
# app.include_router(stock.router,        prefix="/v1/stock")
# app.include_router(suppliers.router,    prefix="/v1/suppliers")
# app.include_router(chat.router,         prefix="/v1/chat")
# app.include_router(public.router,       prefix="/v1/public")
