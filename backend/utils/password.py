from pwdlib import PasswordHash

pwd_hash = PasswordHash.recommended()


def hash_password(password):
    return pwd_hash.hash(password)


def verify_password(password, hashed_password):
    return pwd_hash.verify(password,hashed_password)

