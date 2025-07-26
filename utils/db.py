# utils/db.py
import sqlite3
from pathlib import Path
import os

# Get the database path relative to the project root
DB_PATH = Path(__file__).resolve().parents[1] / "predictions.db"

def get_connection():
    """Create and return a database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def query(sql, params=None, one=False):
    """Execute a query and return results"""
    try:
        with get_connection() as conn:
            cur = conn.execute(sql, params or [])
            rows = cur.fetchall()
        return (rows[0] if rows else None) if one else rows
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return None if one else []

def insert_prediction(data):
    """Insert a new prediction into the database"""
    try:
        with get_connection() as conn:
            cur = conn.execute("""
                INSERT INTO predictions (
                    age, sex, cp, trestbps, chol, fbs, restecg, 
                    thalach, exang, oldpeak, slope, ca, thal,
                    prediction, probability, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """, [
                data.get('age'), data.get('sex'), data.get('cp'),
                data.get('trestbps'), data.get('chol'), data.get('fbs'),
                data.get('restecg'), data.get('thalach'), data.get('exang'),
                data.get('oldpeak'), data.get('slope'), data.get('ca'),
                data.get('thal'), data.get('prediction'), data.get('probability')
            ])
            return cur.lastrowid
    except sqlite3.Error as e:
        print(f"Insert error: {e}")
        return None

def create_tables():
    """Create the predictions table if it doesn't exist"""
    try:
        with get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    age INTEGER,
                    sex INTEGER,
                    cp INTEGER,
                    trestbps INTEGER,
                    chol INTEGER,
                    fbs INTEGER,
                    restecg INTEGER,
                    thalach INTEGER,
                    exang INTEGER,
                    oldpeak REAL,
                    slope INTEGER,
                    ca INTEGER,
                    thal INTEGER,
                    prediction INTEGER,
                    probability REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
    except sqlite3.Error as e:
        print(f"Table creation error: {e}")

# Initialize tables on import
if os.path.exists(DB_PATH):
    create_tables()