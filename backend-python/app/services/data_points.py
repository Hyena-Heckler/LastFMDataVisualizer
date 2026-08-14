import json
import sys

def add_extra_info(cached_song_data):
    # overall statistics object
    statistics = []
    debutObject = {
        "bucket": "Starshot",
        "title": "Number One Debuts",
        "size": None,
        "rows": []
    }
    strongestSecondPlaces = {
        "bucket": "Misses",
        "title": "Strongest #2 Hits",
        "size": 10,
        "rows": []
    }

    # songs info
    songs_info = []

    for song in cached_song_data[1:]:
        total_points = 0
        weeks = 0
        weeks_first = 0
        weeks_top_two = 0
        weeks_top_three = 0
        weeks_top_five = 0
        weeks_top_ten = 0
        is_debut = False
        is_first = False
        previous_pos = None
        biggest_rise = 0
        longest_rise_to_first = 0
        for index, moment in enumerate(song[1:]):
            pos = moment["position"]
            points = moment["points"]
            if pos is not None:
                total_points += points
                weeks += 1
                
                if pos <= 10:
                    weeks_top_ten += 1
                    if pos <= 5:
                        weeks_top_five += 1
                        if pos <= 3:
                            weeks_top_three += 1
                            if pos <= 2:
                                weeks_top_two += 1
                                if pos == 1:
                                    weeks_first += 1
                                    is_first = True
                                    if not is_debut:
                                        debutObject["rows"].append({
                                            "song": song[0],
                                            "value": cached_song_data[0][index + 1]
                                        })
                                else:
                                    strongestSecondPlaces["rows"].append({
                                        "song": song[0],
                                        "value": round(points, 2)
                                    })
                if not is_debut:
                    is_debut = True
                if previous_pos is not None and previous_pos - pos > biggest_rise:
                    biggest_rise = previous_pos - pos
                previous_pos = pos

                if not is_first:
                    longest_rise_to_first += 1

        if not is_first:
            longest_rise_to_first = 0
                
        songs_info.append({
            "song": song[0],
            "total_points": total_points,
            "total_weeks": weeks,
            "points_per_week": total_points/weeks,
            "weeks_number_one": weeks_first,
            "weeks_peaked_at_two": weeks_top_two if weeks_first == 0 else 0,
            "weeks_top_three": weeks_top_three,
            "weeks_top_five": weeks_top_five,
            "weeks_top_ten": weeks_top_ten,
            "weeks_peaked_below_ten": weeks if weeks_top_ten == 0 else 0,
            "biggest_rise": biggest_rise,
            "longest_rise_to_first": longest_rise_to_first
        })
    
    songs_info.sort(key=lambda n: n["total_points"], reverse=True)
    statistics.append({
        "bucket": "Overall",
        "title": "Total Points",
        "size": 10,
        "rows": [
            {
                "song": song["song"],
                "value": round(song["total_points"], 2)
            }
            for song in songs_info
        ]
    })

    songs_info.sort(key=lambda n: n["points_per_week"], reverse=True)
    statistics.append({
        "bucket": "Overall",
        "title": "Highest Average Points",
        "size": 10,
        "rows": [
            {
                "song": song["song"],
                "value": round(song["points_per_week"], 2)
            }
            for song in songs_info
        ]
    })

    songs_info.sort(key=lambda n: n["total_weeks"], reverse=True)
    statistics.append({
        "bucket": "Longevity",
        "title": "Total Weeks",
        "size": 10,
        "rows": [
            {
                "song": song["song"],
                "value": song["total_weeks"]
            }
            for song in songs_info
        ]
    })

    songs_info.sort(key=lambda n: n["weeks_number_one"], reverse=True)
    statistics.append({
        "bucket": "Longevity",
        "title": "Total Weeks at #1",
        "size": 10,
        "rows": [
            {
                "song": song["song"],
                "value": song["weeks_number_one"]
            }
            for song in songs_info
        ]
    })
    

    songs_info.sort(key=lambda n: n["weeks_top_three"], reverse=True)
    statistics.append({
        "bucket": "Longevity",
        "title": "Total Weeks in Top 3",
        "size": 10,
        "rows": [
            {
                "song": song["song"],
                "value": song["weeks_top_three"]
            }
            for song in songs_info
        ]
    })

    songs_info.sort(key=lambda n: n["weeks_top_five"], reverse=True)
    statistics.append({
        "bucket": "Longevity",
        "title": "Total Weeks in Top 5",
        "size": 10,
        "rows": [
            {
                "song": song["song"],
                "value": song["weeks_top_five"]
            }
            for song in songs_info
        ]
    })

    songs_info.sort(key=lambda n: n["weeks_top_ten"], reverse=True)
    statistics.append({
        "bucket": "Longevity",
        "title": "Total Weeks in Top 10",
        "size": 10,
        "rows": [
            {
                "song": song["song"],
                "value": song["weeks_top_ten"]
            }
            for song in songs_info
        ]
    })

    songs_info.sort(key=lambda n: n["weeks_peaked_at_two"], reverse=True)
    statistics.append({
        "bucket": "Misses",
        "title": "Total Weeks Stuck at #2",
        "size": 10,
        "rows": [
            {
                "song": song["song"],
                "value": song["weeks_peaked_at_two"]
            }
            for song in songs_info
        ]
    })

    songs_info.sort(key=lambda n: n["biggest_rise"], reverse=True)
    statistics.append({
        "bucket": "Starshot",
        "title": "Largest Rise",
        "size": 10,
        "rows": [
            {
                "song": song["song"],
                "value": song["biggest_rise"]
            }
            for song in songs_info
        ]
    })

    songs_info.sort(key=lambda n: n["longest_rise_to_first"], reverse=True)
    statistics.append({
        "bucket": "Starshot",
        "title": "Longest Rise to First",
        "size": 10,
        "rows": [
            {
                "song": song["song"],
                "value": song["longest_rise_to_first"]
            }
            for song in songs_info
        ]
    })

    songs_info.sort(key=lambda n: n["weeks_peaked_below_ten"], reverse=True)
    statistics.append({
        "bucket": "Misses",
        "title": "Weeks Never in Top 10",
        "size": 10,
        "rows": [
            {
                "song": song["song"],
                "value": song["weeks_peaked_below_ten"]
            }
            for song in songs_info
        ]
    })

    statistics.append(debutObject)

    strongestSecondPlaces["rows"].sort(key=lambda n: n["value"], reverse=True)
    statistics.append(strongestSecondPlaces)


    return statistics

if __name__ == "__main__":
    with open("./app/services/Data.json", "r", encoding="utf-8") as f:
        cached_song_data = json.load(f)
    with open("./app/services/results.json", "r") as f:
        statistics = json.load(f)

    statistics.append(add_extra_info(cached_song_data['normalCache']['data']))

    with open("./app/services/results.json", "w") as f:
        json.dump(statistics, f, indent=2)
