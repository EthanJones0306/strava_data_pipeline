import json
import os

ANALYSES_DIR = os.path.join(os.path.dirname(__file__), "analyses")


def _ensure_dir():
    os.makedirs(ANALYSES_DIR, exist_ok=True)


def _path(activity_id):
    return os.path.join(ANALYSES_DIR, f"{activity_id}.json")


def save_analysis(activity_id, text, run_data):
    _ensure_dir()
    with open(_path(activity_id), "w") as f:
        json.dump({
            "activity_id": activity_id,
            "text": text,
            "run_name": run_data.get("run_name"),
            "date": run_data.get("date"),
            "distance_km": run_data.get("distance_km"),
        }, f, indent=2)
    print(f"Analysis saved for activity {activity_id}.")


def get_analysis(activity_id):
    try:
        with open(_path(activity_id)) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def list_analyses():
    _ensure_dir()
    results = []
    for fn in sorted(os.listdir(ANALYSES_DIR)):
        if fn.endswith(".json") and fn != ".gitkeep":
            try:
                with open(os.path.join(ANALYSES_DIR, fn)) as f:
                    results.append(json.load(f))
            except (json.JSONDecodeError, FileNotFoundError):
                pass
    return {"analyses": results}
