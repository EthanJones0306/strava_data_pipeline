import os
import csv
import re
from datetime import datetime, timezone
from sqlmodel import Session, select
from database import engine, init_db
from models import Run, Split, BestEffort

RUNS_PATH = os.path.join(os.path.dirname(__file__), "runs.json")
CSV_PATH = os.path.join(os.path.dirname(__file__), "historical_runs.csv")

_last_sync_status = {
    "ok": None,
    "timestamp": None,
    "error": None,
    "new_runs": 0,
}


# --- dict serialization ---

def _run_to_dict(run):
    return {
        "id": run.id,
        "name": run.name,
        "date": run.date,
        "distance_km": run.distance_km,
        "moving_time_sec": run.moving_time_sec,
        "pace_sec_per_km": run.pace_sec_per_km,
        "elevation_gain_m": run.elevation_gain_m,
        "average_hr": run.average_hr,
        "max_hr": run.max_hr,
        "average_watts": run.average_watts,
        "has_power": run.has_power,
        "splits": [
            {
                "km": s.km,
                "pace_sec": s.pace_sec,
                "gap_sec": s.gap_sec,
                "avg_hr": s.avg_hr,
                "elevation_diff_m": s.elevation_diff_m,
            }
            for s in (run.splits or [])
        ],
        "best_efforts": [
            {
                "label": be.label,
                "time_sec": be.time_sec,
                "distance_m": be.distance_m,
            }
            for be in (run.best_efforts or [])
        ],
    }


# --- CSV parsing helpers (only used for seed_from_csv migration) ---

def _parse_date(date_str):
    try:
        dt = datetime.strptime(date_str.strip(), "%B %d, %Y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        return date_str.strip()


def _parse_moving_time(time_str):
    match = re.match(r"(?:(\d+)h\s*)?(\d+)m\s*(\d+)s", time_str.strip())
    if match:
        h = int(match.group(1)) if match.group(1) else 0
        m = int(match.group(2))
        s = int(match.group(3))
        return h * 3600 + m * 60 + s
    match = re.match(r"(\d+)m\s*(\d+)s", time_str.strip())
    if match:
        return int(match.group(1)) * 60 + int(match.group(2))
    return 0


def _parse_pace(pace_str):
    pace_str = pace_str.strip().replace("/km", "").strip()
    match = re.match(r"(\d+):(\d+)", pace_str)
    if match:
        return int(match.group(1)) * 60 + int(match.group(2))
    return 0


def _parse_splits(splits_str):
    if not splits_str or splits_str == "No splits recorded.":
        return []
    result = []
    for split in splits_str.split(" || "):
        match = re.match(r"KM (\d+): (\d+)m(\d+)s @ (\d+:\d+)", split)
        if match:
            km = int(match.group(1))
            pace_min = int(match.group(4).split(":")[0])
            pace_sec = int(match.group(4).split(":")[1])
            pace = pace_min * 60 + pace_sec
            hr_match = re.search(r"(\d+) bpm", split)
            hr = int(hr_match.group(1)) if hr_match else None
            elev_match = re.search(r"([+-]\d+\.?\d*)m", split)
            elev = float(elev_match.group(1)) if elev_match else 0
            result.append({
                "km": km,
                "pace_sec": pace,
                "gap_sec": None,
                "avg_hr": hr,
                "elevation_diff_m": elev,
            })
    return result


def _parse_best_efforts(be_str):
    if not be_str or be_str == "No best efforts recorded.":
        return []
    result = []
    _DISTANCE_MAP = {
        "400m": 400, "800m": 800, "1000m": 1000, "1K": 1000,
        "1/2 mile": 804, "1 Mile": 1609, "1 mile": 1609,
        "2 Mile": 3218, "2 mile": 3218, "5K": 5000, "5 km": 5000,
        "10 mile": 16093, "10K": 10000, "10 km": 10000,
        "15K": 15000, "20K": 20000,
        "Half Marathon": 21097, "Half-Marathon": 21097,
        "Marathon": 42195,
    }
    for effort in be_str.split(" | "):
        match = re.match(r"(.+?): (\d+)m\s*(\d+)s", effort.strip())
        if match:
            label = match.group(1).strip()
            minutes = int(match.group(2))
            seconds = int(match.group(3))
            time_sec = minutes * 60 + seconds
            result.append({
                "label": label,
                "time_sec": time_sec,
                "distance_m": _DISTANCE_MAP.get(label, 0),
            })
    return result


def _csv_row_to_run(row):
    moving_sec = _parse_moving_time(row.get("moving_time", ""))
    pace_sec = _parse_pace(row.get("pace", ""))
    hr_raw = row.get("average_hr", "0")
    max_hr_raw = row.get("max_hr", "0")

    return {
        "name": row.get("run_name", ""),
        "date": _parse_date(row.get("date", "")),
        "distance_km": float(row.get("distance_km", 0)),
        "moving_time_sec": moving_sec,
        "pace_sec_per_km": pace_sec,
        "elevation_gain_m": float(row.get("elevation_gain_m", 0)),
        "average_hr": round(float(hr_raw), 1) if hr_raw and hr_raw != "N/A" else None,
        "max_hr": round(float(max_hr_raw), 1) if max_hr_raw and max_hr_raw != "N/A" else None,
        "average_watts": float(row.get("average_watts", 0)),
        "has_power": row.get("device_watts", "").lower() == "true",
        "splits": _parse_splits(row.get("splits", "")),
        "best_efforts": _parse_best_efforts(row.get("best_efforts", "")),
    }


# --- helpers ---

def _dict_to_models(run_dict):
    """Convert a run dict (from CSV parse or JSON) into ORM models."""
    splits_raw = run_dict.pop("splits", []) or []
    best_efforts_raw = run_dict.pop("best_efforts", []) or []
    run = Run(**run_dict)
    run.splits = [
        Split(**s) for s in splits_raw
    ]
    run.best_efforts = [
        BestEffort(**be) for be in best_efforts_raw
    ]
    return run


def _session_or_create(session):
    if session is not None:
        return session, False
    return Session(engine), True


def get_all_runs(session=None):
    own, close = _session_or_create(session)
    try:
        runs = own.exec(select(Run)).all()
        return {"runs": [_run_to_dict(r) for r in runs]}
    finally:
        if close:
            own.close()


def get_run(activity_id, session=None):
    own, close = _session_or_create(session)
    try:
        run = own.get(Run, activity_id)
        return _run_to_dict(run) if run else None
    finally:
        if close:
            own.close()


def _date_in_store(date_str, session):
    return session.exec(select(Run).where(Run.date == date_str)).first() is not None


def append_run(activity_id, summary_data, detailed_data, session=None):
    own, close = _session_or_create(session)
    try:
        if own.get(Run, activity_id):
            return False

        dist_m = summary_data.get("distance", 0)
        moving_sec = summary_data.get("moving_time", 0)
        avg_speed = summary_data.get("average_speed", 0)
        pace_sec = round(1000 / avg_speed) if avg_speed else 0
        date_raw = summary_data.get("start_date_local", "")
        date_str = date_raw.split("T")[0] if "T" in date_raw else date_raw[:10] if len(date_raw) >= 10 else date_raw
        hr = summary_data.get("average_heartrate")
        max_hr = summary_data.get("max_heartrate")
        has_hr = summary_data.get("has_heartrate", False)

        raw_splits = (detailed_data or {}).get("splits_metric", [])
        splits = [
            Split(
                km=s.get("split"),
                pace_sec=round(1000 / s.get("average_speed", 1)) if s.get("average_speed") else 0,
                gap_sec=round(1000 / s.get("average_grade_adjusted_speed", 1)) if s.get("average_grade_adjusted_speed") else None,
                avg_hr=round(s.get("average_heartrate")) if s.get("average_heartrate") else None,
                elevation_diff_m=round(s.get("elevation_difference", 0), 1),
            )
            for s in raw_splits
        ]

        raw_be = (detailed_data or {}).get("best_efforts", [])
        best_efforts = [
            BestEffort(
                label=be.get("name"),
                time_sec=be.get("moving_time", 0),
                distance_m=be.get("distance", 0),
            )
            for be in raw_be
        ]

        run = Run(
            id=activity_id,
            name=summary_data.get("name", ""),
            date=date_str,
            distance_km=round(dist_m / 1000, 2),
            moving_time_sec=moving_sec,
            pace_sec_per_km=pace_sec,
            elevation_gain_m=round(summary_data.get("total_elevation_gain", 0), 1),
            average_hr=round(hr, 1) if has_hr and hr else None,
            max_hr=round(max_hr, 1) if has_hr and max_hr else None,
            average_watts=round(summary_data.get("average_watts", 0), 1),
            has_power=summary_data.get("device_watts", False),
            splits=splits,
            best_efforts=best_efforts,
        )

        own.add(run)
        own.commit()
        print(f"Appended run {activity_id}: {run.name}")
        return True
    finally:
        if close:
            own.close()


def seed_from_csv(session=None):
    own, close = _session_or_create(session)
    try:
        if own.exec(select(Run).limit(1)).first():
            return

        with open(CSV_PATH, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                run_dict = _csv_row_to_run(row)
                run = _dict_to_models(run_dict)
                own.add(run)
            own.commit()

        count = own.exec(select(Run)).all().__len__()
        print(f"Seeded {count} runs from CSV.")
    finally:
        if close:
            own.close()


def get_sync_status():
    return dict(_last_sync_status)


def sync_from_strava(session=None):
    own, close = _session_or_create(session)
    try:
        from dotenv import load_dotenv
        load_dotenv()

        from authoriser import refresh_access_token
        from strava_api import get_recent_runs, get_activity_details

        _last_sync_status["timestamp"] = datetime.now(timezone.utc).isoformat()

        token = refresh_access_token(
            client_id=os.getenv("CLIENT_ID"),
            client_secret=os.getenv("CLIENT_SECRET"),
            refresh_token=os.getenv("REFRESH_TOKEN"),
        )
        if not token:
            _last_sync_status.update(ok=False, error="Strava auth failed", new_runs=0)
            print("Strava sync: failed to authenticate")
            return

        strava_runs = get_recent_runs(token, num_runs_wanted=10)
        if not strava_runs:
            _last_sync_status.update(ok=True, error=None, new_runs=0)
            print("Strava sync: no runs found")
            return

        new_count = 0
        for sr in strava_runs:
            aid = sr.get("id")
            date_raw = sr.get("start_date_local", "")
            date_str = date_raw.split("T")[0] if "T" in date_raw else date_raw[:10]

            if own.get(Run, aid):
                continue
            if _date_in_store(date_str, own):
                continue

            details = get_activity_details(token, aid)
            if details:
                append_run(aid, sr, details, session=own)
                new_count += 1

        _last_sync_status.update(ok=True, error=None, new_runs=new_count)

        if new_count:
            print(f"Strava sync: added {new_count} new run(s)")
        else:
            print("Strava sync: no new runs")
    finally:
        if close:
            own.close()
