from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/grooves", tags=["grooves"])


@router.post("/", response_model=schemas.GrooveRead)
def create_groove(payload: schemas.GrooveCreate, db: Session = Depends(get_db)):
    row = crud.create_groove(db, payload)
    return crud.groove_to_read(row)


@router.get("/", response_model=list[schemas.GrooveRead])
def list_grooves(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    rows = crud.list_grooves(db, skip=skip, limit=limit)
    return [crud.groove_to_read(r) for r in rows]


@router.get("/{groove_id}", response_model=schemas.GrooveRead)
def get_groove(groove_id: UUID, db: Session = Depends(get_db)):
    row = crud.get_groove(db, groove_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Groove not found")
    return crud.groove_to_read(row)


@router.patch("/{groove_id}", response_model=schemas.GrooveRead)
def patch_groove(
    groove_id: UUID, payload: schemas.GrooveUpdate, db: Session = Depends(get_db)
):
    row = crud.update_groove(db, groove_id, payload)
    if row is None:
        raise HTTPException(status_code=404, detail="Groove not found")
    return crud.groove_to_read(row)


@router.delete("/{groove_id}", status_code=204)
def delete_groove(groove_id: UUID, db: Session = Depends(get_db)):
    if not crud.delete_groove(db, groove_id):
        raise HTTPException(status_code=404, detail="Groove not found")
