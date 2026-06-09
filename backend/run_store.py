import json
import os
import csv
import re
from datetime import datetime

RUNS_PATH = os.path.join(os.path.dirname(__file__), "runs.json")
CSV_PATH = os.path.join(os.path.dirname(__file__), "historical_runs.csv")


# --- Parsing helpers ---

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
                "avg_hr": hr,
                "elevation_diff_m": elev,
            })
    return result


def _parse_best_efforts(be_str):
    if not be_str or be_str == "No best efforts recorded.":
        return []
    result = []
    for effort in be_str.split(" | "):
        match = re.match(r"(.+?): (\d+)m\s*(\d+)s", effort.strip())
        if match:
            label = match.group(1).strip()
            minutes = int(match.group(2))
            seconds = int(match.group(3))
            time_sec = minutes * 60 + seconds
            result.append({"label": label, "time_sec": time_sec})
    return result


def _csv_row_to_run(row):
    moving_sec = _parse_moving_time(row.get("moving_time", ""))
    pace_sec = _parse_pace(row.get("pace", ""))
    hr_raw = row.get("average_hr", "0")
    max_hr_raw = row.get("max_hr", "0")

    return {
        "id": None,
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


# --- Public API ---

def _load_runs():
    try:
        with open(RUNS_PATH) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"runs": [], "next_id": 1}


def _save_runs(data):
    with open(RUNS_PATH, "w") as f:
        json.dump(data, f, indent=2)


def seed_from_csv():
    data = _load_runs()
    if data["runs"]:
        return

    with open(CSV_PATH, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            run = _csv_row_to_run(row)
            run["id"] = data["next_id"]
            data["next_id"] += 1
            data["runs"].append(run)

    _save_runs(data)
    print(f"Seeded {len(data['runs'])} runs from CSV.")


def append_run(activity_id, summary_data, detailed_data):
    data = _load_runs()

    if any(r.get("id") == activity_id for r in data["runs"]):
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
        {
            "km": s.get("split"),
            "pace_sec": round(1000 / s.get("average_speed", 1)) if s.get("average_speed") else 0,
            "avg_hr": round(s.get("average_heartrate")) if s.get("average_heartrate") else None,
            "elevation_diff_m": round(s.get("elevation_difference", 0), 1),
        }
        for s in raw_splits
    ]

    raw_be = (detailed_data or {}).get("best_efforts", [])
    best_efforts = [
        {
            "label": be.get("name"),
            "time_sec": be.get("moving_time", 0),
            "distance_m": be.get("distance", 0),
        }
        for be in raw_be
    ]

    run = {
        "id": activity_id,
        "name": summary_data.get("name", ""),
        "date": date_str,
        "distance_km": round(dist_m / 1000, 2),
        "moving_time_sec": moving_sec,
        "pace_sec_per_km": pace_sec,
        "elevation_gain_m": round(summary_data.get("total_elevation_gain", 0), 1),
        "average_hr": round(hr, 1) if has_hr and hr else None,
        "max_hr": round(max_hr, 1) if has_hr and max_hr else None,
        "average_watts": round(summary_data.get("average_watts", 0), 1),
        "has_power": summary_data.get("device_watts", False),
        "splits": splits,
        "best_efforts": best_efforts,
    }

    data["runs"].append(run)
    _save_runs(data)
    print(f"Appended run {activity_id}: {run['name']}")
    return True


def get_all_runs():
    return _load_runs()


def get_run(activity_id):
    data = _load_runs()
    for r in data["runs"]:
        if r.get("id") == activity_id:
            return r
    return None
