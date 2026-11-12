"""
HelioAlert - SQLite Database Manager
Provides local persistence for NASA OMNI2 historical observations, events, and model evaluation metrics.
"""
import sqlite3
import os
from typing import Optional
import pandas as pd

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'helioalert.db')

def get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(conn: sqlite3.Connection):
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time_tag TEXT UNIQUE NOT NULL,
        year INTEGER,
        doy INTEGER,
        hour INTEGER,
        bt REAL,
        bz_gsm REAL,
        proton_density REAL,
        flow_speed REAL,
        pressure REAL,
        electric_field REAL,
        kp REAL,
        sunspot_number INTEGER,
        dst INTEGER,
        f107 REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_obs_time ON observations(time_tag);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_obs_kp ON observations(kp);")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS historical_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        peak_kp REAL,
        min_dst REAL,
        max_speed REAL,
        min_bz REAL,
        noaa_scale TEXT,
        description TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS model_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_name TEXT NOT NULL,
        version TEXT NOT NULL,
        horizon_hours INTEGER NOT NULL,
        algorithm TEXT NOT NULL,
        training_start TEXT,
        training_end TEXT,
        validation_start TEXT,
        validation_end TEXT,
        test_start TEXT,
        test_end TEXT,
        optimal_threshold REAL,
        precision REAL,
        recall REAL,
        f1_score REAL,
        pr_auc REAL,
        roc_auc REAL,
        tss REAL,
        serialized_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()

def save_observations_to_db(df: pd.DataFrame, conn: sqlite3.Connection):
    cursor = conn.cursor()
    cols = ['time_tag', 'year', 'doy', 'hour', 'bt', 'bz_gsm', 'proton_density',
            'flow_speed', 'pressure', 'electric_field', 'kp', 'sunspot_number', 'dst', 'f107']
    
    insert_sql = f"""
    INSERT OR REPLACE INTO observations ({', '.join(cols)})
    VALUES ({', '.join(['?' for _ in cols])})
    """
    
    sub = df[cols].copy()
    # Replace NaN with None for SQLite NULL
    records = [
        tuple(None if pd.isna(x) else x for x in r)
        for r in sub.itertuples(index=False, name=None)
    ]
    cursor.executemany(insert_sql, records)
    conn.commit()
    print(f"[DB] Inserted/updated {len(records)} records in 'observations' table.")

def seed_historical_events(conn: sqlite3.Connection):
    events = [
        (
            'g5_may_2024',
            'Mother\'s Day Extreme Geomagnetic Storm (May 2024)',
            '2024-05-10T00:00:00Z',
            '2024-05-13T23:00:00Z',
            9.0,
            -406.0,
            1006.0,
            -35.3,
            'G5 - Extreme',
            'Multiple coronal mass ejections (CMEs) from Active Region AR3664 collided with Earth\'s magnetosphere, producing the strongest geomagnetic storm since Halloween 2003 with auroras visible at tropical latitudes.'
        ),
        (
            'g4_march_2024',
            'St. Patrick\'s Equinox Storm (March 2024)',
            '2024-03-23T12:00:00Z',
            '2024-03-25T12:00:00Z',
            8.0,
            -115.0,
            830.0,
            -18.4,
            'G4 - Severe',
            'Severe G4 geomagnetic storm triggered by an X1.1 solar flare and halo CME arrival at Earth.'
        ),
        (
            'g4_april_2023',
            'Supercharged CME Storm (April 2023)',
            '2023-04-23T12:00:00Z',
            '2023-04-25T00:00:00Z',
            8.3,
            -212.0,
            780.0,
            -22.1,
            'G4 - Severe',
            'Severe storm causing intense radio blackouts and widespread auroral activity across mid-latitudes.'
        )
    ]
    cursor = conn.cursor()
    cursor.executemany("""
    INSERT OR REPLACE INTO historical_events (event_id, name, start_time, end_time, peak_kp, min_dst, max_speed, min_bz, noaa_scale, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, events)
    conn.commit()
    print(f"[DB] Seeded {len(events)} historical benchmark events.")
