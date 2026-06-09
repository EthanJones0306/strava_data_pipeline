import json
import os

ANALYSES_DIR = os.path.join(os.path.dirname(__file__), "analyses")


def _ensure_dir():
    os.makedirs(ANALYSES_DIR, exist_ok=True)


def save_analysis(activity_id, analysis_text, run_data):
    _ensure_dir()
    path = os.path.join(ANALYSES_DIR, f"{activity_id}.json")
    entry = {
        "activity_id": activity_id,
        "run_name": run_data.get("run_name"),
        "date": run_data.get("date"),
        "analysis": analysis_text,
    }
    with open(path, "w") as f:
        json.dump(entry, f, indent=2)
    print(f"Analysis saved to {path}")


def get_analysis(activity_id):
    path = os.path.join(ANALYSES_DIR, f"{activity_id}.json")
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        return None


def list_analyses():
    _ensure_dir()
    results = []
    for fname in sorted(os.listdir(ANALYSES_DIR)):
        if fname.endswith(".json"):
            results.append(get_analysis(fname.replace(".json", "")))
    return results
