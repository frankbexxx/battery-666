from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas


def utcnow():
    return datetime.now(timezone.utc)


def groove_to_read(g: models.Groove) -> schemas.GrooveRead:
    return schemas.GrooveRead(
        id=g.id,
        title=g.title,
        bpm=g.bpm,
        events=[schemas.GrooveEventSchema(**e) for e in g.events],
        loop_beats=g.loop_beats,
        created_at=g.created_at,
        updated_at=g.updated_at,
    )


def create_groove(db: Session, data: schemas.GrooveCreate) -> models.Groove:
    loop = data.loop_beats if data.loop_beats is not None else 16
    events = [e.model_dump() for e in sorted(data.events, key=lambda x: x.t)]
    row = models.Groove(
        title=data.title,
        bpm=data.bpm,
        events=events,
        loop_beats=loop,
        created_at=utcnow(),
        updated_at=utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def list_grooves(db: Session, skip: int = 0, limit: int = 50) -> list[models.Groove]:
    stmt = (
        select(models.Groove)
        .order_by(models.Groove.created_at.desc())
        .offset(skip)
        .limit(min(limit, 100))
    )
    return list(db.scalars(stmt).all())


def get_groove(db: Session, groove_id: UUID) -> models.Groove | None:
    return db.get(models.Groove, groove_id)


def update_groove(
    db: Session, groove_id: UUID, data: schemas.GrooveUpdate
) -> models.Groove | None:
    row = get_groove(db, groove_id)
    if row is None:
        return None
    if data.title is not None:
        row.title = data.title
    if data.bpm is not None:
        row.bpm = data.bpm
    if data.events is not None:
        row.events = [e.model_dump() for e in sorted(data.events, key=lambda x: x.t)]
    if data.loop_beats is not None:
        row.loop_beats = data.loop_beats
    row.updated_at = utcnow()
    db.commit()
    db.refresh(row)
    return row


def delete_groove(db: Session, groove_id: UUID) -> bool:
    row = get_groove(db, groove_id)
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True
