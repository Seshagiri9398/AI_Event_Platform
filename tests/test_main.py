from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_openapi_schema(client):
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert "paths" in response.json()


def test_register_user(client):
    response = client.post(
        "/users",
        json={
            "name"     : "Test User",
            "email"    : "pytest_user_002@example.com",
            "password" : "TestPassword123!"
        }
    )

    assert response.status_code == 200
    data = response.json()


    assert data["name"] == "Test User"
    assert data["email"] == "pytest_user_002@example.com"
    assert "password" not in data


def test_register_user_invalid_email(client):
    response = client.post(
        "/users",
        json={
            "name"     : "Test User",
            "email"    : "invalid-email",
            "password" : "TestPassword123!"
        }
    )

    assert response.status_code == 422



def test_register_user_short_password(client):
    response = client.post(
        "/users",
        json={
            "name"     : "Test User",
            "email"    : "short_password@exampl.com",
            "password" : "abc"
        }
    )

    assert response.status_code == 422


def test_register_duplicate_email(client):
    user_data = {
        "name"     : "Duplicate Test",
        "email"    : "duplicate_test@example.com",
        "password" : "TestPassword123!"
    }

    first_response = client.post("/users", json=user_data)
    second_response = client.post("/users", json=user_data)

    assert first_response.status_code == 200
    assert second_response.status_code == 409


def test_user_login(client):
    user_data = {
        "name"     : "Login Test",
        "email"    : "login_test@example.com",
        "password" : "TestPassword123!"
    }

    client.post("/users", json=user_data)

    response = client.post(
        "/login",
        data={
            "username" : user_data["email"],
            "password" : user_data["password"]
        }
    )


def test_login_wrong_password(client):
    user_data = {
        "name"     : "Wrong Password Test",
        "email"    : "wrong_password@example.com",
        "password" : "CorrectPassword123!"
    }

    client.post("/users",json=user_data)

    response = client.post(
        "/login",
        data={
            "username" : user_data["email"],
            "password" : "WrongPassword123!"
        }
    )

def test_login_unknown_email(client):
    response = client.post(
        "/login",
        json={
            "email"    : "unknown_user@example.com",
            "password" : "TestPassword123!"
        }
    )

    assert response.status_code == 401


def test_change_password_without_token(client):
    response = client.post(
        "/users/change-password",
        json={
            "old_password" : "OldPassword123!",
            "new_password" : "NewPassword123!"
        }
    )

    assert response.status_code == 401


def test_change_password_with_valid_token(client):
    client.post(
        "/users",
        json={
            "name"     : "Password Test",
            "email"    : "password_test@example.com",
            "password" : "OldPassword123!"
        }
    )

    login_response = client.post(
        "/login",
        json={
            "email"    : "password_test@example.com",
            "password" : "OldPassword123!"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.post(
        "/users/change-password",
        json={
            "current_password" : "OldPassword123!",
            "new_password"     : "NewPassword123!"
        },
        headers={"Authorization" : f"Bearer {token}"}
    )
  
    assert response.status_code == 200

    new_login_response = client.post(
        "/login",
        json={
            "email" : "password_test@example.com",
            "password" : "NewPassword123!"
        }
    )

    assert new_login_response.status_code == 200
    assert "access_token" in new_login_response.json()


    old_login_response = client.post(
        "/login",
        json={
            "email" : "password_test@example.com",
            "password" : "OldPassword"
        }
    )

    assert old_login_response.status_code == 401


def test_change_password_wrong_current_password(client):
    client.post(
        "/users",
        json={
            "name"     : "Wrong Password Test",
            "email"    : "wrong_password_test@example.com",
            "password" : "OldPassword123!"
        }
    )

    login_response = client.post(
        "/login",
        json={
            "email"    : "wrong_password_test@example.com",
            "password" : "OldPassword123!"
        }
    )

    token = login_response.json()["access_token"]

    response = client.post(
        "/users/change-password",
        json={
            "current_password" : "WrongPassword123!",
            "new_password"     : "NewPassword123!"
        },
        headers={"Authorization" : f"Bearer {token}"}
    )

    assert response.status_code == 400



def test_normal_user_cannot_get_all_users(client):
    client.post(
        "/users",
        json={
            "name" : "Normal User",
            "email" : "normal_user_test@example.com",
            "password" : "TestPassword123!"
        }
    )

    login_response = client.post(
        "/login",
        json={
            "email" : "normal_user_test@example.com",
            "password" : "TestPassword123!"
        }
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/users",
        headers={"Authorization" : f"Bearer {token}"}
    )

    assert response.status_code == 403


def test_get_all_users_without_token(client):
    response = client.get("/users")

    assert response.status_code == 401



def test_admin_bootstrap(client):
    response = client.post(
        "/admin/bootstrap",
        headers={
            "x-admin-bootstrap-secret" : "my-super-secret-admin-key-2002"
        },
        json={
            "name" : "Test Admin",
            "email" : "test_admin@example.com",
            "password" : "AdminPassword123!"
        }

    )

    assert response.status_code == 200
    assert response.json()["role"] == "ADMIN"


def test_admin_can_get_all_users(client):
    login_response = client.post(
        "/login",
        json={
            "email" : "test_admin@example.com",
            "password" : "AdminPassword123!"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json() ["access_token"]

    response = client.get(
        "/users",
        headers={
            "Authorization" : f"Bearer {token}"}
    )

    assert response.status_code == 200



def test_admin_bootstrap_invalid_secret(client):
    response = client.post(
        "/admin/bootstrap",
        headers={
            "x-admin-bootstrap-secret" : "wrong-secret"
        },
        json={
            "name" : "Unauthorized Admin",
            "email" : "unauthorized_admin@example.com",
            "password" : "AdminPassword123!"
        }
    )

    assert response.status_code == 403


def test_admin_bootstrap_missing_secret(client):
    response = client.post(
        "/admin/bootstrap",
         json={
                "name" : "Unauthorized Admin",
                "email" : "unauthorized_admin@example.com",
                "password" : "AdminPassword123!"
        }
    )
    assert response.status_code == 422