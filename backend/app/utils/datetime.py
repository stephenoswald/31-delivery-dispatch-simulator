from datetime import datetime

def utcnow():
    """Naive UTC matches the SQLite schema's timestamp convention."""
    return datetime.utcnow()
