from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://groovepad:groovepad@localhost:5432/groovepad"
    cors_origins: str = "http://localhost:5173"


settings = Settings()
