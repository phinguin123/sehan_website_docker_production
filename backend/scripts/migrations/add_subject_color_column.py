"""
One-off migration: add `color` column to `pt_subjects` and backfill from `fg_color`.

Usage (from project root):
  python3 backend/scripts/migrations/add_subject_color_column.py
"""

import sys
import os

CURRENT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "../../"))
sys.path.append(BACKEND_DIR)

from utils.db import DBHelper  # noqa: E402


def column_exists(db: DBHelper, table: str, column: str) -> bool:
    query = """
        SELECT COUNT(*) AS cnt
        FROM information_schema.COLUMNS
        WHERE TABLE_NAME = %s AND COLUMN_NAME = %s
    """
    row = db.fetch_one(query, (table, column))
    return (row or {}).get('cnt', 0) > 0


def main():
    db = DBHelper()

    # 1) Add column if missing
    if not column_exists(db, 'pt_subjects', 'color'):
        db.execute("ALTER TABLE pt_subjects ADD COLUMN color VARCHAR(7) NULL")

    # 2) Backfill from fg_color where color is NULL
    db.execute("UPDATE pt_subjects SET color = fg_color WHERE color IS NULL AND fg_color IS NOT NULL")

    # 3) Optional: set a default color if still NULL
    db.execute("UPDATE pt_subjects SET color = '#6b7cff' WHERE color IS NULL")

    print("Migration complete: 'color' column added/backfilled on pt_subjects.")


if __name__ == "__main__":
    main()



