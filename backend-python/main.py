from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from app.scripts.prep_data import prep_data, return_color_from_urls
from app.data.cache.render_progress import get
from app.services.render_video import log_ram
from pathlib import Path
import json
import threading
import gc

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
    payload: list
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
    payload = request.payload
    result = prep_data("prepare_cached_data", payload)
    return {"status": "ok", "data": result}

@app.post("/render-video")
def render_video(request: ProcessRequest):

    print(
        "Payload JSON size:",
        len(json.dumps(request.payload)) / 1024 / 1024,
        "MB"
    )

    log_ram("After FastAPI parsing")

    payload = request.payload
    job_id = request.jobId

    log_ram("After payload reference")

    print("entered route")
    print("payload dumped")

    def background_render(payload, job_id):
        print("thread started")
        prep_data(
            "get_video",
            payload,
            VIDEO_DIR,
            job_id
        )
        print("thread finished")

    del payload
    del request
    gc.collect()

    threading.Thread(
        target=background_render,
        args=(payload, job_id),
        daemon=True
    ).start()

    print("returning response")

    return {
        "status": "rendering_started",
        "jobId": request.jobId
    }

@app.post("/calculate-statistics")
def process(request: StatisticsRequest):
    payload = request.payload
    result = prep_data("get_statistics", payload)
    return {"status": "ok", "data": result}


@app.get("/status/{job_id}")
def get_status(job_id: str):
    return get(job_id)

@app.post("/get-album-color")
async def get_colors(request: AlbumColorRequest):
    result = await return_color_from_urls(request.payload)
    return {"status": "ok", "data": result}
