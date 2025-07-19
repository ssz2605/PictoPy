"""
This module contains the main FastAPI application.
"""

from uvicorn import Config, Server  # Uvicorn used to run the ASGI server
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # Enables cross-origin requests

from contextlib import (
    asynccontextmanager,
)  # For lifecycle management (startup/shutdown events)

# Importing DB setup and cleanup functions
from app.database.faces import cleanup_face_embeddings, create_faces_table
from app.database.images import create_image_id_mapping_table, create_images_table
from app.database.albums import create_albums_table
from app.database.yolo_mapping import create_YOLO_mappings
from app.database.folders import create_folders_table

# Face clustering init functions
from app.facecluster.init_face_cluster import get_face_cluster, init_face_cluster

# Routers (modular route handling)
from app.routes.test import router as test_router
from app.routes.images import router as images_router
from app.routes.albums import router as albums_router
from app.routes.facetagging import router as tagging_router

import multiprocessing  # For safe multiprocessing on Windows
from app.scheduler import start_scheduler  # Background scheduler tasks
from app.custom_logging import CustomizeLogger  # Custom logging setup
import os  # For directory handling

# Create a thumbnails directory if it doesn't exist
thumbnails_dir = os.path.join("images", "PictoPy.thumbnails")
os.makedirs(thumbnails_dir, exist_ok=True)


# Define application lifespan: runs on startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and data
    create_YOLO_mappings()
    create_faces_table()
    create_folders_table()
    create_images_table()
    create_image_id_mapping_table()
    create_albums_table()

    # Cleanup old data and initialize clustering engine
    cleanup_face_embeddings()
    init_face_cluster()

    yield  # ⏸ Wait here until app is shutting down

    # On shutdown, save current face cluster state
    face_cluster = get_face_cluster()
    if face_cluster:
        face_cluster.save_to_db()


# Create FastAPI app instance with lifecycle hooks
app = FastAPI(lifespan=lifespan)

# Start background job scheduler
start_scheduler()


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all request headers
)


# Health check route
@app.get("/")
async def root():
    return {"message": "PictoPy Server is up and running!"}


# Include route modules with prefixes and tags
app.include_router(test_router, prefix="/test", tags=["Test"])
app.include_router(images_router, prefix="/images", tags=["Images"])
app.include_router(albums_router, prefix="/albums", tags=["Albums"])
app.include_router(tagging_router, prefix="/tag", tags=["Tagging"])


# Run the server when executing this file directly
if __name__ == "__main__":
    multiprocessing.freeze_support()  # Required for multiprocessing on Windows

    # Setup logger and server config
    app.logger = CustomizeLogger.make_logger("app/logging_config.json")
    config = Config(app=app, host="0.0.0.0", port=8000, log_config=None)

    # Start Uvicorn server
    server = Server(config)
    server.run()
