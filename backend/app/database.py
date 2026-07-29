from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

import re

db_url = settings.DATABASE_URL

# Auto-convert direct Supabase IPv6 domain to IPv4 Pooler URL for Render compatibility
if "db." in db_url and ".supabase.co:5432" in db_url:
    match = re.search(r'db\.([a-z0-9]+)\.supabase\.co:5432', db_url)
    if match:
        proj_ref = match.group(1)
        db_url = re.sub(
            r'postgres(?:ql)?://([^:]+):([^@]+)@db\.' + proj_ref + r'\.supabase\.co:5432/(.+)',
            r'postgresql+asyncpg://\1.' + proj_ref + r':\2@aws-0-sa-east-1.pooler.supabase.com:6543/\3',
            db_url
        )

if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("sqlite://") and not db_url.startswith("sqlite+aiosqlite://"):
    db_url = db_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

connect_args = {}
if "asyncpg" in db_url:
    connect_args["statement_cache_size"] = 0

engine = create_async_engine(
    db_url,
    pool_pre_ping=True,
    echo=False,
    connect_args=connect_args
)

async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

from app.dependencies import get_db
