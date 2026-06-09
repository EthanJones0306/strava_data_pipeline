import os
import sys
from contextlib import asynccontextmanager

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from run_store import get_all_runs, get_run, seed_from_csv
from analysis_store import list_analyses
from analysis_service import get_or_generate_analysis


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_from_csv()
    yield


app = FastAPI(title="Strava Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
def api_get_analysis(activity_id: int):
    a = get_or_generate_analysis(activity_id)
    if not a:
        raise HTTPException(404, "Analysis not found or generation failed")
    return a


@app.get("/api/health")
def api_health():
    return {"status": "ok"}

