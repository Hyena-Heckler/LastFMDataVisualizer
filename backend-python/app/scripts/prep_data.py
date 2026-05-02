import json
import sys
from app.services.song_positions import get_song_position_data
from app.services.data_points import add_extra_info
from app.services.render_video import graph_data
from app.services.accent_color_of_image import *
import datetime
import logging
import traceback
import os
import asyncio

semaphore = asyncio.Semaphore(30)

os.environ["PYTHONIOENCODING"] = "utf-8"


sys.stderr.reconfigure(line_buffering=True, write_through=True)
sys.stdout.reconfigure(line_buffering=True, write_through=True)

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stderr,
    format="%(asctime)s [%(levelname)s] %(message)s",
    force=True
)

logging.info("PYTHON STARTED 2")
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
    for week in data:
        # takes previous week's points and multiplies by a time factor
        time_factor = (1/2) ** (1/4) # in one month, a track loses half its points
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

def format_node_to_python(data):
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

def prepare_cached_data(history):
    try:
        print(history[0]['tracks'][0])
        logging.info("Started Ordering Data Analysis")
        ordered_history = sort_week(history.copy())
        logging.info("Started Ranking Data Analysis")
        ranked_history = points_each_week(ordered_history)
        logging.info("Started Filtering Data Analysis")
        filtered_history = filter_songs_in_week(ranked_history, filter_size = 30)
        logging.info("Started Formatting Data Analysis")
        formatted_history = format_node_to_python(filtered_history)
        logging.info("Started Python Data Analysis")
        song_position_data = get_song_position_data(formatted_history, True)
        song_points_by_position_data = get_song_position_data(formatted_history, True, is_position=False)

        with open('app/data/cache/song_points.json', 'w') as f:
            json.dump(formatted_history, f, indent=2)

        with open('app/data/cache/song_positions.json', 'w') as f:
            json.dump(song_position_data, f, indent=2)

        with open('app/data/cache/song_points_by_positions.json', 'w') as f:
            json.dump(song_points_by_position_data, f, indent=2)
            
        def combine_poi_and_pos(in1, in2):
            return [
                in1[0],
                *[
                    {"position": pos, "points": pts}
                    for pos, pts in zip(in1[1:], in2[1:])
                ]
            ]
        cached_song_data = [song_position_data[0]] + [combine_poi_and_pos(pos_data, poi_data) for pos_data, poi_data in zip(song_position_data[1:], song_points_by_position_data[1:]) ]

        return cached_song_data

    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
    

def get_video(cached_song_data, path):
    try:
        song_position_data = [
            cached_song_data[0],
            *[
                [song_data[0], *list(map(lambda x:x['position'], song_data[1:]))]
                for song_data in cached_song_data[1:]
            ]
        ]
        song_points_by_position_data = [
            cached_song_data[0],
            *[
                [song_data[0], *list(map(lambda x:x['points'], song_data[1:]))]
                for song_data in cached_song_data[1:]
            ]
        ]

        add_extra_info(song_points_by_position_data, song_position_data)
        graph_data(song_position_data, path)

    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

def prep_data(command, payload, video_path = None, job_id = None):
    if command == "prepare_cached_data":
        prepare_cached_data(payload)

    if command == "get_video":
        output_path = video_path / f"{job_id}.mp4"
        get_video(prepare_cached_data(payload), output_path)
        done_flag = video_path / f"{job_id}.done"
        with open(done_flag, "w") as f:
            f.write("done")
        print(f"Saved to {output_path}", file=sys.stderr)

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
    print("[color] batch complete")
    return await asyncio.gather(*tasks)