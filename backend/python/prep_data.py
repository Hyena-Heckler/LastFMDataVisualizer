import json
import sys
from song_positions import get_song_position_data
from data_points import add_extra_info
from render_video import graph_data
import datetime
import logging

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stderr,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

print("PYTHON STARTED", file=sys.stderr)
print("PYTHON STARTED", flush=True)
sys.stderr.flush()

def unix_to_date(unix_time): # turns Unix time to a standard date
    datetime_obj = datetime.datetime.fromtimestamp(unix_time)
    formatted_data = datetime_obj.strftime("(%m/%d/%y)")
    return formatted_data

def sort_week(data): #sorts the week based on the time that the week starts (earliest is first)
    data.sort(key=lambda n: n["weekStart"])
    return data

def points_each_week(data): # gets the number of points for each song in each week
    previous_week = {} # keeps track of the previous week
    for week in data: # goes through every track in the data
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


def main(history):
    try:
        logging.info("Started Ordering Data Analysis")
        ordered_history = sort_week(history)
        logging.info("Started Ranking Data Analysis")
        ranked_history = points_each_week(ordered_history)
        logging.info("Started Filtering Data Analysis")
        filtered_history = filter_songs_in_week(ranked_history, filter_size = 30)
        logging.info("Started Formatting Data Analysis")
        formatted_history = format_node_to_python(filtered_history)
        logging.info("Started Python Data Analysis")
        song_position_data = get_song_position_data(formatted_history, True)
        song_points_by_position_data = get_song_position_data(formatted_history, True, is_position=False)

        print(json.dumps({
            "status": "success"
        }))
        with open('song_points.json', 'w') as f:
            json.dump(formatted_history, f, indent=2)

        with open('song_positions.json', 'w') as f:
            json.dump(song_position_data, f, indent=2)

        with open('song_points_by_positions.json', 'w') as f:
            json.dump(song_points_by_position_data, f, indent=2)

        add_extra_info(song_points_by_position_data, song_position_data)
        graph_data(song_position_data)

    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    json_history = json.loads(sys.stdin.read())
    main(json_history)
