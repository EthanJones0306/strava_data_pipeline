import os
import sys
import json
import urllib.parse
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db
from run_store import get_all_runs, get_run, seed_from_csv, sync_from_strava, get_sync_status
from analysis_store import list_analyses, get_analysis, save_analysis
from analysis_service import get_or_generate_analysis, generate_analysis_background
from health_store import save_health_snapshot, get_health_snapshots
import log_util  # patches built-in print with timestamps


_pending_analyses = set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_from_csv()
    try:
        sync_from_strava()
    except Exception as e:
        print(f"[WARN] Strava sync failed on startup: {e}")
    yield


app = FastAPI(title="Strava Dashboard API", lifespan=lifespan)

LOCAL_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:8000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=LOCAL_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/runs")
def api_get_runs():
    return get_all_runs()


@app.get("/api/runs/latest")
def api_get_latest_run():
    data = get_all_runs()
    if not data["runs"]:
        raise HTTPException(404)
    run = data["runs"][-1]
    analysis = get_or_generate_analysis(run["id"])
    return {"run": run, "analysis": analysis}


@app.get("/api/runs/{activity_id}")
def api_get_run(activity_id: int):
    run = get_run(activity_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return run


@app.get("/api/analyses")
def api_get_analyses():
    return list_analyses()


@app.get("/api/analyses/{activity_id}")
def api_get_analysis(activity_id: int, background_tasks: BackgroundTasks):
    cached = get_analysis(activity_id)
    if cached:
        return cached
    if activity_id in _pending_analyses:
        raise HTTPException(404, detail="Analysis generation in progress, try again shortly")
    _pending_analyses.add(activity_id)
    background_tasks.add_task(generate_analysis_background, activity_id, _pending_analyses)
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=202, content={"status": "pending", "activity_id": activity_id})


@app.get("/api/health")
def api_health():
    return {"status": "ok", "strava_sync": get_sync_status()}


@app.post("/api/sync")
def api_trigger_sync():
    sync_from_strava()
    return get_sync_status()


async def _parse_health_body(request: Request):
    content_type = request.headers.get("content-type", "")
    raw = await request.body()

    if "application/json" in content_type:
        return await request.json()

    decoded = raw.decode("utf-8")
    decoded = urllib.parse.unquote_plus(decoded).rstrip("=")
    brace = decoded.find("{")
    if brace >= 0:
        decoded = decoded[brace:]
    return json.loads(decoded)


@app.post("/api/health")
@app.post("/api/health-data")
async def receive_health_data(request: Request):
    try:
        data = await _parse_health_body(request)
    except (json.JSONDecodeError, ValueError, UnicodeDecodeError) as e:
        raw = (await request.body()).decode("utf-8", errors="replace")[:200]
        return {"status": "error", "msg": f"Invalid data: {e}. Raw: {raw}"}

    snap_id = save_health_snapshot(data)
    return {"status": "success", "id": snap_id}


@app.get("/api/health-data")
def api_get_health_data(limit: int = 30):
    return get_health_snapshots(limit=limit)

