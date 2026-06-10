"""
One-time migration: reads runs.json and historical_runs.csv, inserts into SQLite.
Safe to re-run — skips if runs already exist in the DB.
"""
import json
import os
from sqlmodel import Session, select
from database import engine, init_db
from models import Run, Split, BestEffort

RUNS_PATH = os.path.join(os.path.dirname(__file__), "runs.json")

# Fields that belong to the Run model (everything else is extra/ignored)
_RUN_FIELDS = {
    "id", "name", "date", "distance_km", "moving_time_sec",
    "pace_sec_per_km", "elevation_gain_m", "average_hr", "max_hr",
    "average_watts", "has_power",
}
_SPLIT_FIELDS = {"km", "pace_sec", "gap_sec", "avg_hr", "elevation_diff_m"}
_BE_FIELDS = {"label", "time_sec", "distance_m"}


def migrate():
    init_db()

    with Session(engine) as session:
        if session.exec(select(Run).limit(1)).first():
            print("Database already contains runs, skipping migration.")
            return

        with open(RUNS_PATH) as f:
            data = json.load(f)

        for raw in data.get("runs", []):
            run_dict = {k: raw[k] for k in _RUN_FIELDS if k in raw}
            splits_raw = raw.get("splits") or []
            be_raw = raw.get("best_efforts") or []

            splits = [
                Split(**{k: s[k] for k in _SPLIT_FIELDS if k in s})
                for s in splits_raw
            ]
            best_efforts = [
                BestEffort(**{k: be[k] for k in _BE_FIELDS if k in be})
                for be in be_raw
            ]

            run = Run(**run_dict, splits=splits, best_efforts=best_efforts)
            session.add(run)

        session.commit()
        count = session.exec(select(Run)).all().__len__()
        print(f"Migrated {count} runs from runs.json to SQLite.")


if __name__ == "__main__":
    migrate()
