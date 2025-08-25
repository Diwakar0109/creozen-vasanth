# alembic/env.py (CORRECTED & FINAL)

import os
import sys
from logging.config import fileConfig

from alembic import context
from dotenv import load_dotenv  # <-- Make sure this is imported
from sqlalchemy import engine_from_config
from sqlalchemy import pool

# Add the 'app' directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db.base_class import Base
from app.db.models import *  # noqa: F401, F403
from app.core.config import settings # <-- Import your settings object

# This loads the .env file
load_dotenv() 

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the database URL for Alembic using the SYNC URL from our settings
# This is the key change!
config.set_main_option("sqlalchemy.url", settings.SYNC_DATABASE_URL) 

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    # Use the sync url here as well
    url = settings.SYNC_DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()