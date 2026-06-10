import os
from dotenv import load_dotenv

from run_store import get_run, get_all_runs
from analysis_store import get_analysis, save_analysis
from gemini_analysis import analyze_run
from run_tracker import get_preferred_model, set_preferred_model


def _run_to_comprehensive(run):
    """Convert a run from runs.json to the comprehensive format _build_prompt expects."""
    moving_sec = run.get("moving_time_sec", 0)
    minutes, seconds = divmod(moving_sec, 60)

    pace_sec = run.get("pace_sec_per_km", 0)
    if pace_sec:
        pm, ps = divmod(pace_sec, 60)
        pace_str = f"{pm}:{ps:02d} /km"
    else:
        pace_str = "N/A"

    raw_splits = run.get("splits") or []
    if raw_splits:
        parts = []
        for s in raw_splits:
            km = s.get("km", "")
            sp = s.get("pace_sec", 0)
            sp_min, sp_sec = divmod(sp, 60)
            hr_val = s.get("avg_hr")
            hr_str = f"{round(hr_val)} bpm" if hr_val else "No HR"
            elev = s.get("elevation_diff_m", 0) or s.get("elevation_difference_m", 0) or 0
            elev_str = f"+{elev}m" if elev > 0 else f"{elev}m"
            parts.append(f"KM {km}: {sp_min}:{sp_sec:02d} /km | {elev_str} | {hr_str}")
        splits_str = " || ".join(parts)
    else:
        splits_str = "No splits recorded."

    raw_be = run.get("best_efforts") or []
    if raw_be:
        be_parts = []
        for be in raw_be:
            t = be.get("time_sec", 0)
            m, s = divmod(t, 60)
            be_parts.append(f"{be.get('label', 'Unknown')}: {m}m {s:02d}s")
        be_str = " | ".join(be_parts)
    else:
        be_str = "No best efforts recorded."

    hr = run.get("average_hr")
    max_hr = run.get("max_hr")

    return {
        "run_name": run.get("name", ""),
        "date": run.get("date", ""),
        "description": "N/A",
        "distance_km": run.get("distance_km", 0),
        "moving_time": f"{minutes}m {seconds}s" if minutes else f"{seconds}s",
        "pace": pace_str,
        "elevation_gain_m": run.get("elevation_gain_m", 0),
        "highest_elevation_m": 0,
        "average_watts": run.get("average_watts", 0),
        "device_watts": run.get("has_power", False),
        "average_cadence": "N/A",
        "average_hr": round(hr) if hr else "N/A",
        "max_hr": round(max_hr) if max_hr else "N/A",
        "suffer_score": "N/A",
        "calories": "N/A",
        "gear_used": "N/A",
        "splits": splits_str,
        "best_efforts": be_str,
    }


def _run_to_context_format(run):
    """Convert a run from runs.json to the raw Strava-like format _format_run_context expects."""
    dist_m = run.get("distance_km", 0) * 1000
    moving_sec = run.get("moving_time_sec", 0)
    avg_speed = (dist_m / moving_sec) if moving_sec else 0

    return {
        "name": run.get("name", "Unnamed"),
        "start_date_local": f"{run.get('date', '')}T00:00:00Z",
        "distance": dist_m,
        "moving_time": moving_sec,
        "average_speed": avg_speed,
        "average_heartrate": run.get("average_hr"),
        "total_elevation_gain": run.get("elevation_gain_m", 0),
        "average_watts": run.get("average_watts", 0),
        "sport_type": "Run",
    }


def get_or_generate_analysis(activity_id):
    existing = get_analysis(activity_id)
    if existing:
        print(f"Using cached analysis for {activity_id}")
        return existing

    load_dotenv()

    run = get_run(activity_id)
    if not run:
        print(f"Run {activity_id} not found in store")
        return None

    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        print("GEMINI_API_KEY not set")
        return None

    # Use runs from local store for recent context (matches what frontend shows)
    all_runs = get_all_runs().get("runs", [])
    sorted_runs = sorted(all_runs, key=lambda r: r.get("date", ""), reverse=True)
    # First item should be the run being analyzed, followed by 5 other recent runs
    other_recent = [r for r in sorted_runs if r.get("id") != activity_id][:5]
    recent_context = [_run_to_context_format(run)] + [_run_to_context_format(r) for r in other_recent]

    comprehensive = _run_to_comprehensive(run)

    preferred_model = get_preferred_model()
    result = analyze_run(
        comprehensive, recent_context, gemini_api_key,
        preferred_model=preferred_model,
    )
    if not result:
        print(f"Gemini analysis failed for run {activity_id}")
        return None

    save_analysis(activity_id, result["text"], comprehensive)
    set_preferred_model(result["model"])

    return get_analysis(activity_id)


def generate_analysis_background(activity_id, pending_set):
    try:
        load_dotenv()
        run = get_run(activity_id)
        if not run:
            print(f"Run {activity_id} not found in store")
            return

        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            print("GEMINI_API_KEY not set")
            return

        all_runs = get_all_runs().get("runs", [])
        sorted_runs = sorted(all_runs, key=lambda r: r.get("date", ""), reverse=True)
        other_recent = [r for r in sorted_runs if r.get("id") != activity_id][:5]
        recent_context = [_run_to_context_format(run)] + [_run_to_context_format(r) for r in other_recent]

        comprehensive = _run_to_comprehensive(run)

        preferred_model = get_preferred_model()
        result = analyze_run(
            comprehensive, recent_context, gemini_api_key,
            preferred_model=preferred_model,
        )
        if result:
            save_analysis(activity_id, result["text"], comprehensive)
            set_preferred_model(result["model"])
            print(f"Background analysis complete for {activity_id}")
        else:
            print(f"Background analysis failed for {activity_id}")
    except Exception as e:
        print(f"[ERROR] Background analysis for {activity_id} crashed: {e}")
    finally:
        pending_set.discard(activity_id)
