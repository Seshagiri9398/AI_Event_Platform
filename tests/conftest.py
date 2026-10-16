import os
import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient


load_dotenv()

test_database_url = os.getenv("TEST_DATABASE_URL")


if not test_database_url:
    raise RuntimeError("TEST_DATABASE_URL is missing from .env")

os.environ["TEST_DATABASE_URL"] = test_database_url

from backend.database import Base, get_db
from backend.main import app

test_engine = create_engine(test_database_url)

TestingSessionLocal = sessionmaker(
    autocommit = False,
    autoflush = False,
    bind = test_engine
)


Base.metadata.create_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def cleanup_test_database():
    yield
    Base.metadata.drop_all(bind=test_engine)