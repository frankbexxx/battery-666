"""Normalise Postgres URLs for SQLAlchemy + psycopg3."""


def normalize_postgres_url(url: str) -> str:
    """Render and others often pass `postgresql://...` (no driver). Use psycopg v3."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]
    return url
