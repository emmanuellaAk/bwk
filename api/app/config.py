from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    env: str = "development"
    port: int = 8000
    database_url: str
    jwt_secret: str
    cors_origin: str

    @field_validator("jwt_secret")
    @classmethod
    def jwt_secret_min_length(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return v

    @property
    def is_production(self) -> bool:
        return self.env == "production"


settings = Settings()  # type: ignore[call-arg]
# Pydantic Settings raises a clear ValidationError at import time
# if any required env var is missing — no manual exit() needed.
