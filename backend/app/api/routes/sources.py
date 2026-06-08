from fastapi import APIRouter, HTTPException, Query, status

from app.core.errors import SourceNotFoundError
from app.features.graph.schemas import GraphPatch, NewsSource
from app.features.graph.service import import_graph_patch
from app.features.search.service import get_graph_patch_for_source, search_sources

router = APIRouter()


@router.get("/search", response_model=list[NewsSource], response_model_by_alias=True)
async def search_sources_endpoint(q: str = Query(default="")) -> list[NewsSource]:
    return search_sources(q)


@router.post("/{source_id}/import", response_model=GraphPatch, response_model_by_alias=True)
async def import_source_endpoint(source_id: str) -> GraphPatch:
    try:
        patch = get_graph_patch_for_source(source_id)
    except SourceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    import_graph_patch(patch)
    return patch


@router.get("/{source_id}/patch", response_model=GraphPatch, response_model_by_alias=True)
async def get_source_patch_endpoint(source_id: str) -> GraphPatch:
    try:
        return get_graph_patch_for_source(source_id)
    except SourceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
