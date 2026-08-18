import datetime
import re
from app.services.accent_color_of_image import *

class SongPositions:  # class for creating the playlist information
    def __init__(self, name, artists, image, positions, points):
        self.name = name
        self.artists = artists
        self.image = image
        self.positions = positions
        self.points = points

def get_index(li, target):
    for index, x in enumerate(li):
        if x['key'] == target:
            return index
    return -1


def full_title(track):
    display_name = track['name'] + " [" + track['artists'][0]  # TRY MAKING FUNCTION FOR THIS
    for artist in track['artists'][1:]:
        display_name += ", " + artist
    display_name += "]"
    return display_name


def format_date(curr_date):  # formats the date without parentheses
    current_date_temp = datetime.datetime.strptime(curr_date, "(%m/%d/%y)")
    return re.sub('-', "/", str(current_date_temp.strftime("%m/%d/%y")))

# positions of all songs for all dates
def get_song_position_data(playlist_history, max_position_range=30):
    sheet = {}  # stores the data
    print("Started creating sheet")
    for index, playlist in enumerate(playlist_history, 1):
        for song_index, song in enumerate(playlist['songs']):
            key = (song["name"], tuple(song["artists"]), song["album"])
            if key not in sheet:  # intializes song's history
                sheet[key] = {
                    "name": song['name'],
                    "artists": song['artists'],
                    "image": song['image'],
                    "album": song['album'],
                    "color": song['color'],
                    "values": []
                }

            sheet[key]["values"].append((
                index - 1,
                {
                    "position": song_index + 1, # adds the position of playlist to the position key, shifted by 1 as 0th place is 1st
                    "points": song['points']
                }
            ))
    
    print("Midway Process 1")

    sheet = {
        key: track for key, track in sheet.items()
        if any(value["position"] <= max_position_range for _, value in track["values"])
    }

    total_playlists = len(playlist_history)

    for track in sheet.values():
        arr = [None] * total_playlists

        for playlist_idx, value in track["values"]:
            arr[playlist_idx] = value

        track["values"] = arr

    
    print("Midway Process 2")

    sheet = list(sheet.values())

    final_sheet = [[None]] #final sheet returned
    for playlist in playlist_history: #adds the playlist date as a row in data
        final_sheet[0].append(format_date(playlist['date']))
    for index, track in enumerate(sheet): # formats the name of the title in the chart and adds the track image for future purposes
        # print(track['name'])
        column = [{
            "name": track['name'],
            "artists": track['artists'],
            "album": track['album'],
            "image": track['image'],
            "color": track['color']
        }]
        column.extend(track["values"])
        final_sheet.append(column)
    print("Finished creating sheet")
    return final_sheet

def get_album_position_data(playlist_history, max_position_range=30):
    sheet = {}  # stores the data
    print("Started creating sheet")
    for index, playlist in enumerate(playlist_history, 1):
        for album_index, album in enumerate(playlist['albums']):
            key = (album["name"], tuple(album["artists"]), album["image"])
            if key not in sheet:  # intializes song's history
                sheet[key] = {
                    "name": album['name'],
                    "artists": album['artists'],
                    "image": album['image'],
                    "color": album['color'],
                    "values": []
                }

            sheet[key]["values"].append((
                index - 1,
                {
                    "position": album_index + 1, # adds the position of playlist to the position key, shifted by 1 as 0th place is 1st
                    "points": album['points']
                }
            ))
    
    print("Midway Process 1")

    sheet = {
        key: album for key, album in sheet.items()
        if any(value["position"] <= max_position_range for _, value in album["values"])
    }

    total_playlists = len(playlist_history)

    for track in sheet.values():
        arr = [None] * total_playlists

        for playlist_idx, value in track["values"]:
            arr[playlist_idx] = value

        track["values"] = arr

    
    print("Midway Process 2")

    sheet = list(sheet.values())

    final_sheet = [[None]] #final sheet returned
    for playlist in playlist_history: #adds the playlist date as a row in data
        final_sheet[0].append(format_date(playlist['date']))
    for index, album in enumerate(sheet): # formats the name of the title in the chart and adds the track image for future purposes
        # print(track['name'])
        column = [{
            "name": album['name'],
            "artists": album['artists'],
            "image": album['image'],
            "color": album['color']
        }]
        column.extend(album["values"])
        final_sheet.append(column)
    print("Finished creating sheet")
    return final_sheet

