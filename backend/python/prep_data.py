import json
import sys
from song_positions import song_position_data
from render_video import graph_data
import datetime
import logging

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stderr,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def unix_to_date(unix_time): # turns Unix time to a standard date
    datetime_obj = datetime.datetime.fromtimestamp(unix_time)
    formatted_data = datetime_obj.strftime("(%m/%d/%y)")
    return formatted_data

def sort_week(data):
    data.sort(key=lambda n: n["weekStart"])
    return data

def points_each_week(data):
    previous_week = {}
    for week in data:
        current_week = {
            name: {**track, "points": track["points"] * .841}
            for name, track in previous_week.items()
        }
        for song in week["tracks"]:
            song_name = song["name"] + song["artist"]
            if song_name in current_week:
                current_week[song_name]["points"] += song["count"]
            else:
                new_song_obj = {**{k: v for k, v in song.items() if k != "count"}, "points": song["count"]}
                current_week[song_name] = new_song_obj
        previous_week = current_week
        unordered_tracks = list(current_week.values())
        unordered_tracks.sort(key = lambda n:n["points"], reverse=True)
        week["tracks"] = unordered_tracks
    return data

def filter_songs_in_week(data, filter_size = 30):
    for week in data:
        if len(week["tracks"]) > filter_size:
            week["tracks"] = week["tracks"][:filter_size]
    return data

def format_node_to_python(data):
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
                    "points": track["points"]
                }
                for track in obj["tracks"]
            ]
        }
        for obj in data
    ]
    return transformed


def main(history,):
    try:
        logging.info("Started Ordering Data Analysis")
        ordered_history = sort_week(history)
        logging.info("Started Ranking Data Analysis")
        ranked_history = points_each_week(ordered_history)
        logging.info("Started Filtering Data Analysis")
        filtered_history = filter_songs_in_week(ranked_history)
        logging.info("Started Formatting Data Analysis")
        formatted_history = format_node_to_python(filtered_history)
        logging.info("Started Python Data Analysis")
        result = song_position_data(formatted_history, True)

        print(json.dumps({
            "status": "success"
        }))
        with open('song_points.json', 'w') as f:
            json.dump(filtered_history, f, indent=2)

        with open('song_positions.json', 'w') as f:
            json.dump(result, f, indent=2)

        graph_data(result)

    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    history = json.loads(sys.stdin.read())
    #history = history[0:length_filter]
    main(history)
