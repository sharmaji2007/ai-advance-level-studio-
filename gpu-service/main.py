import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from worker import start_worker
import threading

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start worker thread
    worker_thread = threading.Thread(target=start_worker, daemon=True)
    worker_thread.start()
    logger.info("GPU worker started")
    
    yield
    
    logger.info("Shutting down GPU service")

app = FastAPI(title="AI Studio GPU Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    import torch
    return {
        "status": "ok",
        "cuda_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "vram_total": torch.cuda.get_device_properties(0).total_memory // (1024**2) if torch.cuda.is_available() else 0
    }

@app.get("/gpu/stats")
async def gpu_stats():
    import torch
    if not torch.cuda.is_available():
        return {"error": "CUDA not available"}
    
    return {
        "vram_allocated": torch.cuda.memory_allocated(0) // (1024**2),
        "vram_reserved": torch.cuda.memory_reserved(0) // (1024**2),
        "vram_total": torch.cuda.get_device_properties(0).total_memory // (1024**2)
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
