from fastapi import FastAPI

from app.api.routes import graph, health, sources


def create_app() -> FastAPI:
    app = FastAPI(title="Evidence Graph API", version="0.1.0")
    app.include_router(health.router)
    app.include_router(sources.router, prefix="/api/sources", tags=["sources"])
    app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
    return app


app = create_app()
