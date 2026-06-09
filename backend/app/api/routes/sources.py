from fastapi import APIRouter, HTTPException, Query, status

from app.core.errors import AIExtractionError, AIResponseValidationError, SourceFetchError, SourceNotFoundError
from app.features.ai_extraction.service import extract_graph_patch
from app.features.graph.schemas import GraphPatch, NewsSource
from app.features.graph.service import import_graph_patch
from app.features.ingestion.service import get_source_content
from app.features.search.service import search_sources

router = APIRouter()


@router.get("/search", response_model=list[NewsSource], response_model_by_alias=True)
async def search_sources_endpoint(q: str = Query(default="")) -> list[NewsSource]:
    try:
        return search_sources(q)
    except SourceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except SourceFetchError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/{source_id}/import", response_model=GraphPatch, response_model_by_alias=True)
async def import_source_endpoint(source_id: str) -> GraphPatch:
    try:
        patch = extract_graph_patch(get_source_content(source_id))
    except SourceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except SourceFetchError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except (AIExtractionError, AIResponseValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    import_graph_patch(patch)
    return patch


@router.get("/{source_id}/patch", response_model=GraphPatch, response_model_by_alias=True)
async def get_source_patch_endpoint(source_id: str) -> GraphPatch:
    try:
        return extract_graph_patch(get_source_content(source_id))
    except SourceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except SourceFetchError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except (AIExtractionError, AIResponseValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
