import json
from sqlmodel import Session, select
from database import engine
from models import RunningEconomy, Run


def _session_or_create(session):
    if session is not None:
        return session, False
    return Session(engine), True


def _match_run_by_date(date_str, distance_km, session):
    runs = session.exec(select(Run).where(Run.date == date_str)).all()
    if len(runs) == 0:
        return None
    if len(runs) == 1:
        return runs[0].id
    best = min(runs, key=lambda r: abs(r.distance_km - distance_km))
    return best.id


def save_workout(data, session=None):
    own, close = _session_or_create(session)
    try:
        uuid = data.get("uuid", "")
        if not uuid:
            print("Workout save: missing uuid, skipping")
            return None

        start_date_raw = data.get("startDate", "")
        date_str = start_date_raw[:10] if len(start_date_raw) >= 10 else start_date_raw

        cadence = None
        c = data.get("cadence")
        if isinstance(c, dict):
            cadence = c.get("value")
        elif c is not None:
            cadence = float(c)

        vert_osc = None
        vo = data.get("runningVerticalOscillation")
        if isinstance(vo, dict):
            vert_osc = vo.get("value")
        elif vo is not None:
            vert_osc = float(vo)

        gct = None
        gc = data.get("runningGroundContactTime")
        if isinstance(gc, dict):
            gct = gc.get("value")
        elif gc is not None:
            gct = float(gc)

        stride = None
        sl = data.get("runningStrideLength")
        if isinstance(sl, dict):
            stride = sl.get("value")
        elif sl is not None:
            stride = float(sl)

        distance_km = None
        dist = data.get("distance")
        if isinstance(dist, dict):
            distance_km = dist.get("value")
        elif dist is not None:
            distance_km = float(dist)

        existing = own.exec(
            select(RunningEconomy).where(RunningEconomy.workout_uuid == uuid)
        ).first()

        if existing is None:
            existing = RunningEconomy(workout_uuid=uuid)
            own.add(existing)

        existing.start_date = date_str
        existing.cadence_spm = cadence
        existing.vertical_oscillation_cm = vert_osc
        existing.ground_contact_time_ms = gct
        existing.stride_length_m = stride
        existing.raw_json = json.dumps(data)

        run_id = _match_run_by_date(date_str, distance_km, own)
        existing.run_id = run_id

        own.commit()
        own.refresh(existing)

        match_info = f"matched to run {run_id}" if run_id else "no run match"
        print(f"Saved workout {uuid[:8]}… ({date_str}, {match_info})")

        return {
            "id": existing.id,
            "workout_uuid": existing.workout_uuid,
            "run_id": existing.run_id,
            "start_date": existing.start_date,
            "cadence_spm": existing.cadence_spm,
            "vertical_oscillation_cm": existing.vertical_oscillation_cm,
            "ground_contact_time_ms": existing.ground_contact_time_ms,
            "stride_length_m": existing.stride_length_m,
        }
    finally:
        if close:
            own.close()


def get_workout_for_run(run_id, session=None):
    own, close = _session_or_create(session)
    try:
        result = own.exec(
            select(RunningEconomy).where(RunningEconomy.run_id == run_id)
        ).first()
        if not result:
            return None
        return {
            "id": result.id,
            "workout_uuid": result.workout_uuid,
            "run_id": result.run_id,
            "start_date": result.start_date,
            "cadence_spm": result.cadence_spm,
            "vertical_oscillation_cm": result.vertical_oscillation_cm,
            "ground_contact_time_ms": result.ground_contact_time_ms,
            "stride_length_m": result.stride_length_m,
        }
    finally:
        if close:
            own.close()


def get_all_workouts(limit=1000, session=None):
    own, close = _session_or_create(session)
    try:
        results = own.exec(
            select(RunningEconomy).order_by(RunningEconomy.start_date.desc()).limit(limit)
        ).all()
        return [
            {
                "id": r.id,
                "workout_uuid": r.workout_uuid,
                "run_id": r.run_id,
                "start_date": r.start_date,
                "cadence_spm": r.cadence_spm,
                "vertical_oscillation_cm": r.vertical_oscillation_cm,
                "ground_contact_time_ms": r.ground_contact_time_ms,
                "stride_length_m": r.stride_length_m,
            }
            for r in results
        ]
    finally:
        if close:
            own.close()
