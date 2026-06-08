import json
import os

STATE_PATH = os.path.join(os.path.dirname(__file__), "state.json")


def is_new_run(activity_id):
    """Returns True if this activity_id hasn't been sent before."""
    state = _load_state()
    return state.get("last_sent_activity_id") != activity_id


def mark_run_sent(activity_id):
    """Records this activity_id as sent."""
    _save_state({"last_sent_activity_id": activity_id})


def _load_state():
    try:
        with open(STATE_PATH) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"last_sent_activity_id": None}


def _save_state(state):
    with open(STATE_PATH, "w") as f:
        json.dump(state, f, indent=2)
