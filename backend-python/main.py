from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from app.scripts.prep_data import prep_data, return_color_from_urls
from app.services.render_video import log_ram
from pathlib import Path

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
    log_ram("Before prepare-cached")
    payload = request.payload
    result = prep_data("prepare_cached_data", payload)
    log_ram("After prepare-cached")
    return {"status": "ok", "data": result}

@app.post("/calculate-statistics")
def process(request: StatisticsRequest):
    log_ram("Before statistics")
    payload = request.payload
    result = prep_data("get_statistics", payload)
    log_ram("After statistics")
    return {"status": "ok", "data": result}

@app.post("/get-album-color")
async def get_colors(request: AlbumColorRequest):
    result = await return_color_from_urls(request.payload)
    log_ram("After album color request")
    return {"status": "ok", "data": result}
