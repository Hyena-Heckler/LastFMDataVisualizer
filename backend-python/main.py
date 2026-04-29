from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from app.scripts.prep_data import prep_data, return_color_from_urls
from pathlib import Path
import os
BASE_DIR = Path(__file__).resolve().parents[1]
VIDEO_DIR = BASE_DIR / "backend-python" / "temp" / "videos"

app = FastAPI()

class Track(BaseModel):
    name: str
    artist: str
    image: str
    album: str
    count: int
    color_r: float
    color_g: float
    color_b: float

class Week(BaseModel):
    weekStart: int
    tracks: List[Track]

class ProcessRequest(BaseModel):
    payload: List[Week]
    jobId: Optional[str] = None

class CombinedData(BaseModel):
    position: int
    points: float

class AlbumColorRequest(BaseModel):
    payload: List[Dict[str, Any]]

@app.post("/prepare-cached")
def process(request: ProcessRequest):
    payload = [w.model_dump() for w in request.payload]
    result = prep_data("prepare_cached_data", payload)
    return {"status": "ok", "data": result}

@app.post("/render-video")
def render_video(request: ProcessRequest):
    payload = [w.model_dump() for w in request.payload]
    result = prep_data("get_video", payload, request.jobId)
    return {"status": "rendering_started", "jobId": request.jobId, "data": result}


@app.get("/status/{job_id}")
def get_status(job_id: str):
    done_file = VIDEO_DIR / f"{job_id}.done"

    if done_file.exists():
        return {
            "status": "done",
            "jobId": job_id,
            "ready": True
        }

    return {
        "status": "processing",
        "jobId": job_id,
        "ready": False
    }

@app.post("/get-album-color")
async def get_colors(request: AlbumColorRequest):
    result = await return_color_from_urls(request.payload)
    return {"status": "ok", "data": result}
