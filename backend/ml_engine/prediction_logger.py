"""
Nirvighna ML Engine — Database, Logging & Audit Manager (Steps 8, 9, 10, 11, 14)
Supports SQLite (default local DB) and PostgreSQL (via DATABASE_URL environment variable).
Manages tables: prediction_logs, actual_footfall, model_monitoring, model_versions, audit_logs.
"""

import os
import json
import sqlite3
from datetime import datetime
import pandas as pd

# Environment configurations
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prediction_logs.db')
DATABASE_URL = os.getenv('DATABASE_URL', '')

def get_connection():
    """
    Returns DB connection (PostgreSQL if DATABASE_URL is provided, else SQLite).
    """
    if DATABASE_URL and DATABASE_URL.startswith(('postgresql://', 'postgres://')):
        try:
            import psycopg2
            return psycopg2.connect(DATABASE_URL), 'postgres'
        except Exception as e:
            print(f"[WARN] Postgres connection failed ({e}). Falling back to SQLite.")
    
    conn = sqlite3.connect(DB_FILE)
    return conn, 'sqlite'

def init_db():
    """
    Creates all required database tables for Nirvighna ML engine.
    """
    conn, db_type = get_connection()
    cursor = conn.cursor()

    if db_type == 'sqlite':
        cursor.executescript('''
            CREATE TABLE IF NOT EXISTS prediction_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                temple TEXT NOT NULL,
                date TEXT NOT NULL,
                time_slot TEXT NOT NULL,
                predicted_footfall INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                actual_footfall INTEGER DEFAULT NULL,
                actual_source TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS actual_footfall (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                temple TEXT NOT NULL,
                date TEXT NOT NULL,
                time_slot TEXT NOT NULL,
                footfall_count INTEGER NOT NULL,
                source TEXT NOT NULL, -- 'gate_scan', 'cctv', 'booking', 'manual'
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(temple, date, time_slot, source)
            );

            CREATE TABLE IF NOT EXISTS model_monitoring (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                temple TEXT NOT NULL,
                date TEXT NOT NULL,
                time_slot TEXT NOT NULL,
                predicted_footfall INTEGER NOT NULL,
                actual_footfall INTEGER NOT NULL,
                mae REAL NOT NULL,
                mape REAL NOT NULL,
                is_drift BOOLEAN DEFAULT 0,
                evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS model_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version_id TEXT UNIQUE NOT NULL,
                trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                train_data_size INTEGER NOT NULL,
                real_data_count INTEGER NOT NULL,
                synthetic_data_count INTEGER NOT NULL,
                test_mae REAL NOT NULL,
                test_mape REAL NOT NULL,
                test_r2 REAL NOT NULL,
                is_active BOOLEAN DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL, -- 'PREDICTION', 'FEEDBACK', 'RETRAIN', 'ROLLBACK', 'INGESTION', 'DRIFT'
                description TEXT NOT NULL,
                user_id TEXT DEFAULT 'system',
                details_json TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        # Migrate prediction_logs schema if created prior
        try:
            cursor.execute("ALTER TABLE prediction_logs ADD COLUMN actual_source TEXT DEFAULT NULL")
        except Exception:
            pass
    else:
        # Postgres DDL
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS prediction_logs (
                id SERIAL PRIMARY KEY,
                temple VARCHAR(100) NOT NULL,
                date VARCHAR(20) NOT NULL,
                time_slot VARCHAR(50) NOT NULL,
                predicted_footfall INT NOT NULL,
                risk_level VARCHAR(50) NOT NULL,
                actual_footfall INT DEFAULT NULL,
                actual_source VARCHAR(50) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS actual_footfall (
                id SERIAL PRIMARY KEY,
                temple VARCHAR(100) NOT NULL,
                date VARCHAR(20) NOT NULL,
                time_slot VARCHAR(50) NOT NULL,
                footfall_count INT NOT NULL,
                source VARCHAR(50) NOT NULL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_actual_slot_source UNIQUE(temple, date, time_slot, source)
            );

            CREATE TABLE IF NOT EXISTS model_monitoring (
                id SERIAL PRIMARY KEY,
                temple VARCHAR(100) NOT NULL,
                date VARCHAR(20) NOT NULL,
                time_slot VARCHAR(50) NOT NULL,
                predicted_footfall INT NOT NULL,
                actual_footfall INT NOT NULL,
                mae FLOAT NOT NULL,
                mape FLOAT NOT NULL,
                is_drift BOOLEAN DEFAULT FALSE,
                evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS model_versions (
                id SERIAL PRIMARY KEY,
                version_id VARCHAR(100) UNIQUE NOT NULL,
                trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                train_data_size INT NOT NULL,
                real_data_count INT NOT NULL,
                synthetic_data_count INT NOT NULL,
                test_mae FLOAT NOT NULL,
                test_mape FLOAT NOT NULL,
                test_r2 FLOAT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                user_id VARCHAR(100) DEFAULT 'system',
                details_json TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')

    conn.commit()
    conn.close()

def log_audit(event_type, description, user_id="system", details=None):
    """
    STEP 14: Log audit entries for DPDP Act 2023 compliance.
    """
    try:
        init_db()
        conn, db_type = get_connection()
        cursor = conn.cursor()
        details_str = json.dumps(details or {})
        ph = '%s' if db_type == 'postgres' else '?'

        cursor.execute(f'''
            INSERT INTO audit_logs (event_type, description, user_id, details_json, created_at)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph})
        ''', (event_type, description, user_id, details_str, datetime.now().isoformat()))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[ERROR] Failed to log audit event: {e}")

def log_prediction(temple, date_str, time_slot, predicted_footfall, risk_level, user_id="pilgrim_portal"):
    """
    Inserts prediction into prediction_logs and logs audit trace.
    """
    try:
        init_db()
        conn, db_type = get_connection()
        cursor = conn.cursor()
        ph = '%s' if db_type == 'postgres' else '?'

        cursor.execute(f'''
            INSERT INTO prediction_logs (temple, date, time_slot, predicted_footfall, risk_level, actual_footfall, created_at)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, NULL, {ph})
        ''', (temple, date_str, time_slot, int(predicted_footfall), risk_level, datetime.now().isoformat()))
        conn.commit()
        conn.close()

        # DPDP Audit Log (No PII stored)
        log_audit(
            event_type="PREDICTION",
            description=f"ML Prediction generated for {temple} on {date_str} ({time_slot}): {predicted_footfall} ({risk_level})",
            user_id=user_id,
            details={"temple": temple, "date": date_str, "time_slot": time_slot, "predicted": int(predicted_footfall), "risk": risk_level}
        )
    except Exception as e:
        print(f"[ERROR] Logging prediction failed: {e}")

def record_actual_footfall(temple, date_str, time_slot, footfall_count, source="manual", user_id="staff"):
    """
    STEP 9 & STEP 13: Records ground truth footfall from gate_scan, cctv, booking, or manual.
    """
    try:
        init_db()
        conn, db_type = get_connection()
        cursor = conn.cursor()
        ph = '%s' if db_type == 'postgres' else '?'

        if db_type == 'sqlite':
            cursor.execute('''
                INSERT INTO actual_footfall (temple, date, time_slot, footfall_count, source, recorded_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(temple, date, time_slot, source) DO UPDATE SET
                    footfall_count = excluded.footfall_count,
                    recorded_at = excluded.recorded_at
            ''', (temple, date_str, time_slot, int(footfall_count), source, datetime.now().isoformat()))
        else:
            cursor.execute('''
                INSERT INTO actual_footfall (temple, date, time_slot, footfall_count, source, recorded_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT(temple, date, time_slot, source) DO UPDATE SET
                    footfall_count = EXCLUDED.footfall_count,
                    recorded_at = EXCLUDED.recorded_at
            ''', (temple, date_str, time_slot, int(footfall_count), source, datetime.now().isoformat()))

        conn.commit()
        conn.close()

        # Also update prediction_logs with the highest priority source count
        update_prediction_log_actual(temple, date_str, time_slot)

        # Audit log for DPDP Compliance
        log_audit(
            event_type="FEEDBACK" if source == "manual" else "INGESTION",
            description=f"Ground truth footfall recorded for {temple} on {date_str} ({time_slot}): {footfall_count} via {source}",
            user_id=user_id,
            details={"temple": temple, "date": date_str, "time_slot": time_slot, "count": int(footfall_count), "source": source}
        )
        print(f"[OK] Ground truth recorded for {temple} {date_str} {time_slot}: {footfall_count} ({source})")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to record actual footfall: {e}")
        return False

def update_prediction_log_actual(temple, date_str, time_slot):
    """
    Deduplicates actual footfall sources using priority: gate_scan > cctv > booking > manual.
    Updates prediction_logs.actual_footfall with the winning source value.
    """
    try:
        conn, db_type = get_connection()
        ph = '%s' if db_type == 'postgres' else '?'

        df = pd.read_sql_query(f'''
            SELECT source, footfall_count
            FROM actual_footfall
            WHERE temple = {ph} AND date = {ph} AND time_slot = {ph}
        ''', conn, params=(temple, date_str, time_slot))

        if df.empty:
            conn.close()
            return

        # Deduplication hierarchy dictionary
        priority_map = {'gate_scan': 4, 'cctv': 3, 'booking': 2, 'manual': 1}
        df['priority'] = df['source'].map(lambda s: priority_map.get(s, 0))
        df_sorted = df.sort_values(by='priority', ascending=False)
        
        winner = df_sorted.iloc[0]
        winning_count = int(winner['footfall_count'])
        winning_source = winner['source']

        cursor = conn.cursor()
        cursor.execute(f'''
            UPDATE prediction_logs
            SET actual_footfall = {ph}, actual_source = {ph}
            WHERE temple = {ph} AND date = {ph} AND time_slot = {ph}
        ''', (winning_count, winning_source, temple, date_str, time_slot))

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[ERROR] Error updating prediction log actual value: {e}")

def export_audit_logs(format_type="json"):
    """
    STEP 14: Export DPDP Act 2023 compliance audit logs for regulators.
    No PII is included — only anonymized telemetry, timestamps, and model operations.
    """
    conn, _ = get_connection()
    df = pd.read_sql_query('''
        SELECT id, event_type, description, user_id, details_json, created_at
        FROM audit_logs
        ORDER BY id DESC
    ''', conn)
    conn.close()

    if format_type == "csv":
        return df.to_csv(index=False)
    else:
        return df.to_dict(orient="records")

if __name__ == '__main__':
    init_db()
    print("[OK] Nirvighna ML Engine DB & Audit Manager initialized.")
