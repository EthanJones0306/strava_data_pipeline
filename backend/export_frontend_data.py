import os, json
from run_store import get_all_runs
from database import init_db

FRONTEND_PUBLIC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "public")
OUTPUT_PATH = os.path.join(FRONTEND_PUBLIC, "runs.json")


def export_frontend_data():
    init_db()
    data = get_all_runs()
    os.makedirs(FRONTEND_PUBLIC, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Exported {len(data['runs'])} runs to {OUTPUT_PATH}")
    return len(data["runs"])


if __name__ == "__main__":
    export_frontend_data()
