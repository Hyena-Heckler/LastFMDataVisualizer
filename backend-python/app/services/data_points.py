def add_extra_info(cached_song_data):
    data = [
        cached_song_data[0],
        *[
            [song_data[0], *list(map(lambda x:x['points'], song_data[1:]))]
            for song_data in cached_song_data[1:]
        ]
    ]
    song_position_data = [
        cached_song_data[0],
        *[
            [song_data[0], *list(map(lambda x:x['position'], song_data[1:]))]
            for song_data in cached_song_data[1:]
        ]
    ]

    # overall statistics object
    statistics = []

    # songs info
    songs_info = []
    for song in data[1:]:
        only_points = list(filter(None, song[1:]))
        songs_info.append({
            "song": song[0],
            "total_points": sum(only_points),
            "total_weeks": len(only_points),
            "points_per_week": sum(only_points)/len(only_points)
        })

    songs_info.sort(key=lambda n: n["total_points"], reverse=True)

    statistics.append({
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
    
    
    songs_info.sort(key=lambda n: n["total_weeks"], reverse=True)

    statistics.append({
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

    songs_info.sort(key=lambda n: n["points_per_week"], reverse=True)

    statistics.append({
        "title": "Total Points Per Week",
        "size": 10,
        "rows": [
            {
                "song": song["song"],
                "value": round(song["points_per_week"], 2)
            }
            for song in songs_info
        ]
    })
    
    songs_info = []
    for song in song_position_data[1:]:
        only_points = list(filter(None, song[1:]))
        only_one = only_points.count(1)
        only_two = only_points.count(2)
        top_three = len(list(filter(lambda x: x <= 3, only_points)))
        top_five = len(list(filter(lambda x: x <= 5, only_points)))
        top_ten = len(list(filter(lambda x: x <= 10, only_points)))
        songs_info.append({
            "song": song[0],
            "weeks_number_one": only_one,
            "weeks_number_two": only_two,
            "weeks_top_three": top_three,
            "weeks_top_five": top_five,
            "weeks_top_ten": top_ten
        })

    songs_info.sort(key=lambda n: n["weeks_number_one"], reverse=True)
    statistics.append({
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

    songs_info.sort(key=lambda n: n["weeks_number_two"], reverse=True)
    statistics.append({
        "title": "Total Weeks Stuck at #2",
        "size": 10,
        "rows": [
            {
                "song": song["song"],
                "value": song["weeks_number_two"]
            }
            for song in songs_info
        ]
    })

    debutObject = {
        "title": "Number One Debuts",
        "size": None,
        "rows": []
    }
    for song in song_position_data[1:]:
        for index, pos in enumerate(song[1:]):
            if pos is not None:
                if pos == 1:
                    debutObject["rows"].append({
                        "song": song[0],
                        "value": song_position_data[0][index + 1],
                    })
                break
    statistics.append(debutObject)

    return statistics


