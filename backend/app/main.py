from contextlib import asynccontextmanager
import asyncio
from sqlalchemy import text
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio

from app.core.config import settings
from app.api import auth, campaigns, templates, emails, parse, unsubscribe
from app.core.database import engine
from app.models import base

# Create database tables
base.Base.metadata.create_all(bind=engine)


async def ping_db_forever():
    """Hit DB with SELECT 1 every 12 hours to keep Aiven free tier awake."""
    while True:
        await asyncio.sleep(12 * 60 * 60)
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("DB keep-alive ping OK")
        except Exception as e:
            print(f"DB keep-alive ping failed: {e}")


@asynccontextmanager
async def lifespan(app):
    task = asyncio.create_task(ping_db_forever())
    yield
    task.cancel()


# Socket.IO setup
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=settings.CORS_ORIGINS
)

# Create FastAPI app
app = FastAPI(
    title="Macsauce Bomber API",
    description="Bulk personalized email sender with Gmail integration",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["Campaigns"])
app.include_router(templates.router, prefix="/api/templates", tags=["Templates"])
app.include_router(emails.router, prefix="/api/emails", tags=["Emails"])
app.include_router(parse.router, prefix="/api/parse", tags=["File Parsing"])
app.include_router(unsubscribe.router, prefix="/api", tags=["Unsubscribe"])

# Socket.IO events
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

# Combine FastAPI and Socket.IO
socket_app = socketio.ASGIApp(sio, app)

@app.get("/health")
@app.get("/api/health")
async def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "db": "connected",
            "version": settings.VERSION
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "db": "disconnected",
            "error": str(e),
            "version": settings.VERSION
        }

@app.get("/")
async def root():
    return {"message": "Macsauce Bomber API", "docs": "/api/docs"}
