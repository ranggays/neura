import pytest

from app.features.graph.service import reset_graph_state


@pytest.fixture(autouse=True)
def reset_state() -> None:
    reset_graph_state()


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"
