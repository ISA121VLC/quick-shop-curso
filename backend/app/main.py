from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.startup import init_database
from app.routers import auth, cart, orders, products, users


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_database(get_settings())
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="QuickShop API", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health", tags=["health"])
    def health():
        return {"status": "ok"}

    for router in (auth.router, users.router, products.router, cart.router, orders.router):
        app.include_router(router, prefix="/api")
    return app


app = create_app()
