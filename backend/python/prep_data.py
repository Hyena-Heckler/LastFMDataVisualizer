import json
import sys
from song_positions import song_position_data
import datetime
import logging

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stderr,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def unix_to_date(unix_time): # turns Unix time to a standard date
    datetime_obj = datetime.datetime.fromtimestamp(unix_time/1000)
    formatted_data = datetime_obj.strftime("(%m/%d/%y)")
    return formatted_data

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
                    "album": track["album"]
                }
                for track in obj["tracks"]
            ]
        }
        for obj in data
    ]
    return transformed


def main():
    try:

        history = json.loads(sys.stdin.read())
        formatted_history = format_node_to_python(history)

        result = song_position_data(formatted_history, True, split_artist = True)

        print(json.dumps({
            "status": "success",
            "data": result
        }))

    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    logging.info("Started Python Data Analysis")
    main()
