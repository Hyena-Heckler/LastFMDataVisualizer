import sys
from app.services.song_positions import get_song_position_data, get_album_position_data
from app.services.data_points import add_extra_info
from app.services.accent_color_of_image import *
import datetime
import traceback
import os
import asyncio


semaphore = asyncio.Semaphore(30)

os.environ["PYTHONIOENCODING"] = "utf-8"


sys.stderr.reconfigure(line_buffering=True, write_through=True)
sys.stdout.reconfigure(line_buffering=True, write_through=True)

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')
sys.stderr.flush()

def unix_to_date(unix_time): # turns Unix time to a standard date
    datetime_obj = datetime.datetime.fromtimestamp(unix_time)
    formatted_data = datetime_obj.strftime("(%m/%d/%y)")
    return formatted_data

def sort_week(data): #sorts the week based on the time that the week starts (earliest is first)
    data.sort(key=lambda n: n["weekStart"])
    return data

def points_each_week(data):
    previous_week = {}
    
    time_factor = (1/2) ** (1/4) # in one month, a track loses half its points
    for week in data:
        # takes previous week's points and multiplies by a time factor
        current_week = {
            name: {**track, "points": track["points"] * time_factor}
            for name, track in previous_week.items()
        }
        for song in week["tracks"]:
            song_name = song["name"] + song["artist"]
            if song_name in current_week:
                current_week[song_name]["points"] += song["count"]
            else:
                new_song_obj = {**{k: v for k, v in song.items() if k != "count"}, "points": song["count"]}
                current_week[song_name] = new_song_obj
        previous_week = current_week # records the current week as being the previous one
        ordered_tracks = list(current_week.values())
        ordered_tracks.sort(key = lambda n:n["points"], reverse=True) # sorts tracks with highest points first
        week["tracks"] = ordered_tracks
    return data

def filter_songs_in_week(data, filter_size = 30):
    for week in data:
        if len(week["tracks"]) > filter_size:
            week["tracks"] = week["tracks"][:filter_size]
    return data

def song_format_node_to_python(data):
    print(data[0]["tracks"][0])
    transformed = [
        {
            "date": unix_to_date(obj["weekStart"]),
            "songs": [
                {
                    "name": track["name"],
                    "artists": [
                        track["artist"]
                    ],
                    "image": track["image"],
                    "album": track["album"],
                    "points": track["points"],
                    "color": [track["color_r"], track["color_g"], track["color_b"]]
                }
                for track in obj["tracks"]
            ]
        }
        for obj in data
    ]
    return transformed

def album_filtered_points_each_week(data, filter_size = 30):
    album_data = []
    breadth_factor = .5

    for week in data:
        current_week = {}
        for song in week["tracks"]:
            album_index = (song["album"], song["image"])
            if album_index in current_week:
                current_week[album_index]["points"] += song["points"] ** breadth_factor
            else:
                current_week[album_index] = {
                    "album": song["album"],
                    "artists": [
                        song["artist"]
                    ],
                    "image": song["image"],
                    "points": song["points"] ** breadth_factor,
                    "color_r": song["color_r"],
                    "color_g": song["color_g"], 
                    "color_b": song["color_b"]
                }
        ordered_albums = list(current_week.values())
        ordered_albums.sort(key = lambda n:n["points"], reverse=True) # sorts albums with highest points first
        album_data.append({
            "weekStart": week["weekStart"],
            "albums": ordered_albums[:filter_size]
        })


    return album_data

def album_format_node_to_python(data):
    print(data[0]["albums"][0])
    transformed = [
        {
            "date": unix_to_date(obj["weekStart"]),
            "albums": [
                {
                    "name": album["album"],
                    "artists": [
                        album["artists"][0]
                    ],
                    "image": album["image"],
                    "points": album["points"],
                    "color": [album["color_r"], album["color_g"], album["color_b"]]
                }
                for album in obj["albums"]
            ]
        }
        for obj in data
    ]
    return transformed

def prepare_cached_data(history):
    try:
        max_filter_size = 30
        ordered_history = sort_week(history.copy())
        song_ranked_history = points_each_week(ordered_history)

        album_filtered_ranked_history = album_filtered_points_each_week(song_ranked_history, filter_size = max_filter_size)
        formatted_album_history = album_format_node_to_python(album_filtered_ranked_history)
        cached_album_data = get_album_position_data(formatted_album_history, True)
        
        filtered_song_history = filter_songs_in_week(song_ranked_history, filter_size = max_filter_size)
        formatted_song_history = song_format_node_to_python(filtered_song_history)
        cached_song_data = get_song_position_data(formatted_song_history, True)

        
            

        return {
            "tracks": cached_song_data,
            "albums": cached_album_data
        }

    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

def get_statistics(cached_song_data):
    return add_extra_info(cached_song_data)

def prep_data(command, payload):
    if command == "prepare_cached_data":
        return prepare_cached_data(payload)

    if command == "get_statistics":
        return add_extra_info(payload)

async def return_color_from_urls(payload):
    print(f"[color] start batch size={len(payload)}")
    async def handle(row):
        async with semaphore:
            color = await get_color(row["image_url"])
            return {
                "album_id": row["album_id"],
                "color": color
            }

    tasks = [handle(r) for r in payload]
    return await asyncio.gather(*tasks)

import json
from pathlib import Path
if __name__ == "__main__":
    json_path = Path(__file__).parent / "PartialData.json"

    with json_path.open("r", encoding="utf-8") as f:
        payload_data = json.load(f)

    result = prep_data("prepare_cached_data", payload_data)

    output_path = Path(__file__).parent / "output.json"

    with output_path.open("w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)