from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class Run(SQLModel, table=True):
    __tablename__ = "runs"

    id: int = Field(default=None, primary_key=True)
    name: str
    date: str
    distance_km: float
    moving_time_sec: int
    pace_sec_per_km: int
    elevation_gain_m: float
    average_hr: Optional[float] = None
    max_hr: Optional[float] = None
    average_watts: float = 0
    has_power: bool = False

    splits: List["Split"] = Relationship(
        back_populates="run",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    best_efforts: List["BestEffort"] = Relationship(
        back_populates="run",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Split(SQLModel, table=True):
    __tablename__ = "splits"

    id: int = Field(default=None, primary_key=True)
    run_id: int = Field(foreign_key="runs.id")
    km: int
    pace_sec: int
    gap_sec: Optional[int] = None
    avg_hr: Optional[int] = None
    elevation_diff_m: float = 0

    run: Run = Relationship(back_populates="splits")


class BestEffort(SQLModel, table=True):
    __tablename__ = "best_efforts"

    id: int = Field(default=None, primary_key=True)
    run_id: int = Field(foreign_key="runs.id")
    label: str
    time_sec: int
    distance_m: int

    run: Run = Relationship(back_populates="best_efforts")


class HealthSnapshot(SQLModel, table=True):
    __tablename__ = "health_snapshots"

    id: int = Field(default=None, primary_key=True)
    date: str = Field(index=True, unique=True)
    recorded_at: str = ""
    steps: Optional[int] = None
    wrist_temp: Optional[float] = None
    active_energy: Optional[float] = None
    rhr: Optional[int] = None
    cardio_recovery: Optional[float] = None
    flights: Optional[int] = None
    walk_run_distance: Optional[float] = None
    walking_hr: Optional[float] = None
    running_stride_length: Optional[float] = None
    exercise_minutes: Optional[int] = None
    v02_max: Optional[float] = None


class RunningEconomy(SQLModel, table=True):
    __tablename__ = "running_economy"

    id: int = Field(default=None, primary_key=True)
    workout_uuid: str = Field(index=True, unique=True)
    run_id: Optional[int] = Field(foreign_key="runs.id", default=None, nullable=True)
    start_date: str = Field(index=True)
    cadence_spm: Optional[float] = None
    vertical_oscillation_cm: Optional[float] = None
    ground_contact_time_ms: Optional[float] = None
    stride_length_m: Optional[float] = None
    raw_json: Optional[str] = None
