import numpy as np
import json
# just to see some info for now
def add_extra_info(data, song_position_data):
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
    print("Total Points")
    for index, song in enumerate(songs_info[:15]):
        print(f'{index + 1}. {song["song"]["name"]}: {song["total_points"]}')

    songs_info.sort(key=lambda n: n["total_weeks"], reverse=True)
    print("Total Weeks")
    for index, song in enumerate(songs_info[:15]):
        print(f'{index + 1}. {song["song"]["name"]}: {song["total_weeks"]}')

    songs_info.sort(key=lambda n: n["points_per_week"], reverse=True)
    print("Points Per Week")
    for index, song in enumerate(songs_info[:15]):
        print(f'{index + 1}. {song["song"]["name"]}: {song["points_per_week"]}')

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
    print("Total Weeks at Number One")
    for index, song in enumerate(songs_info[:15]):
        print(f'{index + 1}. {song["song"]["name"]}: {song["weeks_number_one"]}')

    songs_info.sort(key=lambda n: n["weeks_top_three"], reverse=True)
    print("Total Weeks Top Three")
    for index, song in enumerate(songs_info[:15]):
        print(f'{index + 1}. {song["song"]["name"]}: {song["weeks_top_three"]}')

    songs_info.sort(key=lambda n: n["weeks_top_five"], reverse=True)
    print("Total Weeks Top Five")
    for index, song in enumerate(songs_info[:15]):
        print(f'{index + 1}. {song["song"]["name"]}: {song["weeks_top_five"]}')

    songs_info.sort(key=lambda n: n["weeks_top_ten"], reverse=True)
    print("Total Weeks Top Ten")
    for index, song in enumerate(songs_info[:15]):
        print(f'{index + 1}. {song["song"]["name"]}: {song["weeks_top_ten"]}')


    songs_info.sort(key=lambda n: n["weeks_number_two"], reverse=True)
    print("Total Weeks Stuck at Number Two")
    i = 1
    for song in songs_info[:15]:
        if song["weeks_number_one"] == 0:
            print(f'{i}. {song["song"]["name"]}: {song["weeks_number_two"]}')
            i += 1

    print("Number One Debut")
    for song in song_position_data[1:]:
        for index, pos in enumerate(song[1:]):
            if pos is not None:
                if pos == 1:
                    print(f'Week of {song_position_data[0][index + 1]}: {song[0]["name"]}')
                break


