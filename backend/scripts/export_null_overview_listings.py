"""
Export listings where review_sections->overview is null.
Outputs: restaurant_id, restaurant_name, listing_id, review_sections
Usage: python export_null_overview_listings.py
"""

import csv
import json
import os
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

# Load .env from backend/
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

DB_URL = os.getenv("SUPABASE_DB_URL")
if not DB_URL:
    sys.exit("SUPABASE_DB_URL not set in .env")

QUERY = """
SELECT
    r.id          AS restaurant_id,
    r.name        AS restaurant_name,
    l.id          AS listing_id,
    l.review_sections
FROM listings l
JOIN restaurants r ON l.restaurant_id = r.id
WHERE l.review_sections IS NOT NULL
  AND (l.review_sections->>'overview') IS NULL
ORDER BY r.name;
"""

OUTPUT_FILE = Path(__file__).resolve().parent / "null_overview_listings.csv"


def main():
    conn = psycopg2.connect(DB_URL)
    try:
        with conn.cursor() as cur:
            cur.execute(QUERY)
            rows = cur.fetchall()
            print(f"Found {len(rows)} listings with null overview.")

        with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["restaurant_id", "restaurant_name", "listing_id", "review_sections"])
            for restaurant_id, restaurant_name, listing_id, review_sections in rows:
                writer.writerow([
                    restaurant_id,
                    restaurant_name,
                    listing_id,
                    json.dumps(review_sections) if review_sections is not None else "",
                ])

        print(f"Saved to {OUTPUT_FILE}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
