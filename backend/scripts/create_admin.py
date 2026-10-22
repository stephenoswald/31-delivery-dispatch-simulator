"""Run from backend: python -m scripts.create_admin --email admin@example.com --name Admin."""
import argparse
import getpass
from app.db.session import SessionLocal
from app.core.security import hash_password
from app.models import User
from app.schemas.auth import Credentials


def main():
    parser = argparse.ArgumentParser(description="Create a local administrator account")
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True)
    args = parser.parse_args()
    password = getpass.getpass("Admin password (8–128 characters): ")
    if password != getpass.getpass("Confirm password: "):
        parser.error("Passwords do not match")
    try:
        credentials = Credentials(email=args.email, password=password)
    except ValueError:
        parser.error("A valid email and an 8–128 character password are required")
    if not args.name.strip() or len(args.name) > 120:
        parser.error("Name must contain 1–120 characters")
    with SessionLocal() as db:
        if db.query(User).filter_by(email=credentials.email).first():
            parser.error("Email already registered; no account was changed")
        db.add(User(email=credentials.email, full_name=args.name, role="admin", password_hash=hash_password(password)))
        db.commit()
    print("Administrator created")

if __name__ == "__main__":
    main()
