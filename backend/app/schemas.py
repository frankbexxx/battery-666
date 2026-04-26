from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class GrooveEventSchema(BaseModel):
    kind: Literal["drum", "melody"]
    target: str = Field(..., min_length=1, max_length=64)
    t: float = Field(..., ge=0)


class GroovePayloadSchema(BaseModel):
    version: Literal[1] = 1
    bpm: int = Field(..., ge=60, le=200)
    events: list[GrooveEventSchema]
    pack_id: str | None = Field(default=None, max_length=80)
    loop_beats: int | None = Field(default=None, ge=1, le=512)

    @field_validator("events")
    @classmethod
    def sort_events(cls, v: list[GrooveEventSchema]) -> list[GrooveEventSchema]:
        return sorted(v, key=lambda e: e.t)


class GrooveCreate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    bpm: int = Field(..., ge=60, le=200)
    events: list[GrooveEventSchema]
    pack_id: str | None = Field(default=None, max_length=80)
    loop_beats: int | None = Field(default=16, ge=1, le=512)


class GrooveUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    bpm: int | None = Field(default=None, ge=60, le=200)
    events: list[GrooveEventSchema] | None = None
    pack_id: str | None = Field(default=None, max_length=80)
    loop_beats: int | None = Field(default=None, ge=1, le=512)


class GrooveRead(BaseModel):
    id: UUID
    title: str | None
    bpm: int
    events: list[GrooveEventSchema]
    pack_id: str | None
    loop_beats: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
