from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import graph, health, sources

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def create_app() -> FastAPI:
    app = FastAPI(title="Evidence Graph API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(sources.router, prefix="/api/sources", tags=["sources"])
    app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
    return app


app = create_app()
