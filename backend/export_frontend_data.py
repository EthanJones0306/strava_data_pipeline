import os, json
from run_store import get_all_runs
from health_store import get_health_snapshots
from workout_store import get_all_workouts
from database import init_db

FRONTEND_PUBLIC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "public")
RUNS_PATH = os.path.join(FRONTEND_PUBLIC, "runs.json")
HEALTH_PATH = os.path.join(FRONTEND_PUBLIC, "health.json")
WORKOUTS_PATH = os.path.join(FRONTEND_PUBLIC, "workouts.json")


def export_frontend_data():
    init_db()
    data = get_all_runs()
    os.makedirs(FRONTEND_PUBLIC, exist_ok=True)
    with open(RUNS_PATH, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Exported {len(data['runs'])} runs to {RUNS_PATH}")
    return len(data["runs"])


def export_workout_data():
    init_db()
    data = get_all_workouts(limit=1000)
    os.makedirs(FRONTEND_PUBLIC, exist_ok=True)
    with open(WORKOUTS_PATH, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Exported {len(data)} workouts to {WORKOUTS_PATH}")
    return len(data)


def export_health_data():
    init_db()
    data = get_health_snapshots(limit=1000)
    os.makedirs(FRONTEND_PUBLIC, exist_ok=True)
    with open(HEALTH_PATH, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Exported {len(data)} health snapshots to {HEALTH_PATH}")
    return len(data)


if __name__ == "__main__":
    export_frontend_data()
    export_health_data()
    export_workout_data()
