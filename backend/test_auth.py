import pytest
from fastapi.testclient import TestClient
import types

import main

client = TestClient(main.app)

# Patch database related functions to use in-memory store for tests
_users = {}

def fake_create_user(email: str, password: str):
    # store plain for simplicity in test context only
    _users[email] = {"email": email, "password_hash": password, "role": "free", "points": 100}
    return fake_get_user(email)

class DummyUser:
    def __init__(self, **data):
        self.email = data['email']
        self.password_hash = data['password_hash']
        self.role = data['role']
        self.points = data['points']

class UserInDB(main.UserInDB):
    pass

def fake_get_user(email: str):
    row = _users.get(email)
    if not row:
        return None
    return UserInDB(**row)

def fake_verify_password(plain: str, hashed: str):
    return plain == hashed

main.create_user = fake_create_user
main.get_user = fake_get_user
main.verify_password = fake_verify_password

@pytest.fixture(scope='function')
def cleanup():
    _users.clear()
    yield
    _users.clear()

def test_register_and_login_flow(cleanup):
    # register
    r = client.post('/register', json={'email': 'user@example.com', 'password': 'pass123'})
    assert r.status_code == 200
    token = r.json()['access_token']
    assert token

    # login
    r2 = client.post('/token', data={'username': 'user@example.com', 'password': 'pass123'})
    assert r2.status_code == 200
    token2 = r2.json()['access_token']
    assert token2

    # me with token2
    r3 = client.get('/me', headers={'Authorization': f'Bearer {token2}'})
    assert r3.status_code == 200
    payload = r3.json()
    assert payload['sub'] == 'user@example.com'

    # refresh
    r4 = client.post('/refresh', headers={'Authorization': f'Bearer {token2}'})
    assert r4.status_code == 200
    new_token = r4.json()['access_token']
    assert new_token != ''
