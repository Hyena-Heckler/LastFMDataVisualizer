import json
import datetime
import re
import sys
from app.services.accent_color_of_image import *
import logging

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stderr,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

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


# access a sheet that displays the song and artists in brackets
def access_display_sheet(playlist_history):
    sheet = []
    for playlist in playlist_history:
        column = [format_date(playlist['date'])]
        for song in playlist['songs']:
            column.append(full_title(song))
        sheet.append(column)
    return sheet


# positions of all songs for all dates
def get_song_position_data(playlist_history, include_none_dates, max_position_range=30, is_position=True):  # include_none_dates determines if None dates are included in position
    attribute = 'positions' if is_position else 'points'

    sheet = {}  # stores the data
    logging.info("Started creating sheet")
    for index, playlist in enumerate(playlist_history, 1):
        logging.info("First Half: %f", index/len(playlist_history))
        for song_index, song in enumerate(playlist['songs']):
            song_key = (song["name"], tuple(song["artists"]), tuple(song["album"]))
            if song_key not in sheet:  # intializes song's history
                sheet[song_key] = {
                    "name": song['name'],
                    "artists": song['artists'],
                    "image": song['image'],
                    "album": song['album'],
                    "color": song['color'],
                    "positions": [],
                    "points": []
                }

            if is_position:
                sheet[song_key][attribute].append(
                    (index - 1, song_index + 1))  # adds the position of playlist to the position key, shifted by 1 as 0th place is 1st
            else:
                sheet[song_key][attribute].append(
                    (index - 1, song['points']))
    
    logging.info("Midway Process 1")

    if is_position:
        sheet = {
            key: track for key, track in sheet.items()
            if any(value <= max_position_range for _, value in track[attribute])
        }

    total_playlists = len(playlist_history)

    for track in sheet.values():
        arr = [None] * total_playlists

        for playlist_idx, value in track[attribute]:
            arr[playlist_idx] = value

        track[attribute] = arr
    
    logging.info("Midway Process 2")

    sheet = list(sheet.values())

    final_sheet = [[None]] #final sheet returned
    for playlist in playlist_history: #adds the playlist date as a row in data
        final_sheet[0].append(format_date(playlist['date']))
    for index, track in enumerate(sheet): # formats the name of the title in the chart and adds the track image for future purposes
        # logging.info(track['name'])
        logging.info("Second Half: %f", index/len(sheet))
        column = [{
            "name": track['name'],
            "artists": track['artists'],
            "album": track['album'],
            "image": track['image'],
            "color": track['color']
        }]
        column.extend(track[attribute])
        final_sheet.append(column)
    logging.info("Finished creating sheet")
    return final_sheet

