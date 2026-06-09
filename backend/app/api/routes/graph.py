from fastapi import APIRouter

from app.features.graph.schemas import GraphState
from app.features.graph.service import get_graph_state, reset_graph_state

router = APIRouter()


@router.get("", response_model=GraphState, response_model_by_alias=True)
async def get_graph_endpoint() -> GraphState:
    return get_graph_state()


@router.post("/reset", response_model=GraphState, response_model_by_alias=True)
async def reset_graph_endpoint() -> GraphState:
    reset_graph_state()
    return get_graph_state()
