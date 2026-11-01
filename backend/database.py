import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent

raw_db_url = os.getenv("DATABASE_URL", "").strip()

if raw_db_url:
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace(
            "postgres://", "postgresql+psycopg://", 1
        )
    elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+psycopg://"):
        raw_db_url = raw_db_url.replace(
            "postgresql://", "postgresql+psycopg://", 1
        )

    DATABASE_URL = raw_db_url
    connect_args = {}
    if "postgresql" in DATABASE_URL and "sslmode" not in DATABASE_URL and "localhost" not in DATABASE_URL and "127.0.0.1" not in DATABASE_URL:
        connect_args["sslmode"] = "require"

    engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

else:
    DATABASE_URL = f"sqlite:///{BASE_DIR / 'studymate.db'}"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()