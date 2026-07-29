from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from app.scripts.prep_data import prep_data, return_color_from_urls
from pathlib import Path
import os
import threading
import json
VIDEO_DIR = Path("/tmp/videos")
VIDEO_DIR.mkdir(parents=True, exist_ok=True)

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

class StatisticsRequest(BaseModel):
    payload: list[list[Any]]

@app.post("/prepare-cached")
def process(request: ProcessRequest):
    payload = [w.model_dump() for w in request.payload]
    result = prep_data("prepare_cached_data", payload)
    return {"status": "ok", "data": result}

@app.post("/render-video")
def render_video(request: ProcessRequest):
    print("entered route")
    payload = [w.model_dump() for w in request.payload]
    print("payload dumped")

    def background_render():
        print("thread started")
        prep_data(
            "get_video",
            payload,
            VIDEO_DIR,
            request.jobId
        )
        print("thread finished")

    threading.Thread(
        target=background_render,
        daemon=True
    ).start()

    print("returning response")

    return {
        "status": "rendering_started",
        "jobId": request.jobId
    }

@app.post("/calculate-statistics")
def process(request: StatisticsRequest):
    payload = [w.model_dump() for w in request.payload]
    result = prep_data("get_statistics", payload)
    return {"status": "ok", "data": result}


@app.get("/status/{job_id}")
def get_status(job_id: str):
    done_file = VIDEO_DIR / f"{job_id}.json"

    if done_file.exists():
        with open(done_file, "r") as f:
            data = json.load(f)

        return {
            "status": "done",
            "jobId": job_id,
            "ready": True,
            "r2Key": data["r2Key"]
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
