from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from uuid import UUID

from app.clients import supabase
from app.config import settings
from app.services.phase_config import invalidate_cache

router = APIRouter(prefix="/admin/phases", tags=["admin"])


async def verify_admin_key(x_admin_key: str = Header(...)):
	if x_admin_key != settings.admin_api_key:
		raise HTTPException(status_code=403, detail="Ongeldige admin key.")


class PhaseUpdate(BaseModel):
	description: str | None = None
	system_instruction: str | None = None


class RequirementCreate(BaseModel):
	criterion: str
	order_index: int


@router.get("/", dependencies=[Depends(verify_admin_key)])
async def list_phases():
	result = supabase.table("phases").select("*").order("order_index").execute()
	return result.data


@router.patch("/{phase_id}", dependencies=[Depends(verify_admin_key)])
async def update_phase(phase_id: UUID, update: PhaseUpdate):
	data = {k: v for k, v in update.model_dump().items() if v is not None}
	supabase.table("phases").update(data).eq("id", str(phase_id)).execute()
	invalidate_cache()
	return {"status": "updated"}


@router.post("/{phase_id}/requirements", dependencies=[Depends(verify_admin_key)])
async def add_requirement(phase_id: UUID, req: RequirementCreate):
	result = supabase.table("phase_requirements").insert({
		"phase_id": str(phase_id),
		"criterion": req.criterion,
		"order_index": req.order_index,
	}).execute()
	invalidate_cache()
	return result.data[0]


@router.delete("/requirements/{requirement_id}", dependencies=[Depends(verify_admin_key)])
async def delete_requirement(requirement_id: UUID):
	supabase.table("phase_requirements").delete().eq("id", str(requirement_id)).execute()
	invalidate_cache()
	return {"status": "deleted"}