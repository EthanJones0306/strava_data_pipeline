from datetime import datetime
from sqlmodel import Session, select
from database import engine
from models import HealthSnapshot


def _parse_date(date_str):
    try:
        dt = datetime.strptime(date_str.strip(), "%d %b %Y at %H:%M")
        return dt.strftime("%Y-%m-%d"), dt.isoformat()
    except ValueError:
        try:
            dt = datetime.fromisoformat(date_str)
            return dt.strftime("%Y-%m-%d"), dt.isoformat()
        except ValueError:
            return date_str[:10], date_str


def _session_or_create(session):
    if session is not None:
        return session, False
    return Session(engine), True


def save_health_snapshot(data, session=None):
    own, close = _session_or_create(session)
    try:
        date_key, recorded_at = _parse_date(data.get("date", ""))
        snapshot = own.exec(
            select(HealthSnapshot).where(HealthSnapshot.date == date_key)
        ).first()
        if snapshot is None:
            snapshot = HealthSnapshot(date=date_key)
            own.add(snapshot)

        snapshot.recorded_at = recorded_at
        snapshot.steps = data.get("steps")
        snapshot.wrist_temp = data.get("wrist_temp")
        snapshot.active_energy = data.get("active_energy")
        snapshot.rhr = data.get("rhr")
        snapshot.cardio_recovery = data.get("cardio_recovery")
        snapshot.flights = data.get("flights")
        snapshot.walk_run_distance = data.get("walk_run_distance")
        snapshot.walking_hr = data.get("walking_hr")
        snapshot.running_stride_length = data.get("running_stride_length")
        snapshot.exercise_minutes = data.get("exercise_minutes")
        snapshot.v02_max = data.get("v02_max")

        own.commit()
        own.refresh(snapshot)
        print(f"Saved health snapshot for {date_key}")
        return snapshot.id
    finally:
        if close:
            own.close()


def get_health_snapshots(limit=30, session=None):
    own, close = _session_or_create(session)
    try:
        snapshots = own.exec(
            select(HealthSnapshot).order_by(HealthSnapshot.date.desc()).limit(limit)
        ).all()
        return [
            {
                "id": s.id,
                "date": s.date,
                "recorded_at": s.recorded_at,
                "steps": s.steps,
                "wrist_temp": s.wrist_temp,
                "active_energy": s.active_energy,
                "rhr": s.rhr,
                "cardio_recovery": s.cardio_recovery,
                "flights": s.flights,
                "walk_run_distance": s.walk_run_distance,
                "walking_hr": s.walking_hr,
                "running_stride_length": s.running_stride_length,
                "v02_max": s.v02_max,
                "exercise_minutes": s.exercise_minutes,
            }
            for s in snapshots
        ]
    finally:
        if close:
            own.close()
