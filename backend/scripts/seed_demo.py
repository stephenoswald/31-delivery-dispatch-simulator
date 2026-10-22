"""Run from backend: python -m scripts.seed_demo."""
import argparse
import getpass
from app.db.seed import seed_demo
from app.db.session import SessionLocal


def main():
    parser = argparse.ArgumentParser(description="Seed 1 admin, 8 customers, and 21 riders")
    parser.add_argument("--prompt-password", action="store_true",
                        help="Prompt for a custom password instead of DemoPass123!")
    args = parser.parse_args()
    password = getpass.getpass("Demo account password: ") if args.prompt_password else "DemoPass123!"
    try:
        with SessionLocal.begin() as db:
            if db.bind.dialect.name == "sqlite":
                db.connection().exec_driver_sql("BEGIN IMMEDIATE")
            result = seed_demo(db, password)
    except ValueError as exc:
        parser.error(str(exc))
    print(result)


if __name__ == "__main__":
    main()
