import json
import datetime
import re
import sys
from accent_color_of_image import *
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
    attribute = 'points'
    if is_position:
        attribute = 'positions'
    sheet = []  # stores the data
    logging.info("Started creating sheet")
    for index, playlist in enumerate(playlist_history, 1):
        for song in playlist['songs']:
            song_key = song["name"] + "|" + ",".join(song["artists"]) + "|" + ",".join(song["album"])
            if get_index(sheet, song_key) == -1:  # intializes song's history
                sheet.append({
                    "key": song_key,
                    "name": song['name'],
                    "artists": song['artists'],
                    "image": song['image'],
                    "positions": [],
                    "points": []
                })
                if include_none_dates:
                    for i in range(
                            index - 1):  # adds a None value for position for every date prior to the playlist date that didn't exist
                        sheet[get_index(sheet, song_key)][attribute].append(None)

            song_index = get_index(sheet, song_key)
            if is_position:
                sheet[song_index][attribute].append(
                    playlist['songs'].index(song) + 1)  # adds the position of playlist to the position key, shifted by 1 as 0th place is 1st
            else:
                sheet[song_index][attribute].append(
                    song['points'])
        if include_none_dates: 
            for track in sheet: 
                if len(track[
                           attribute]) != index:  # if the length does not match index (has one less position), then it adds a None value to position
                    track[attribute].append(None)

    if is_position:
        sheet = [
            track for track in sheet
            if min(pos for pos in track[attribute] if pos is not None) <= max_position_range # helps decrease amount of data stored
        ]
    final_sheet = [[None]] #final sheet returned
    for playlist in playlist_history: #adds the playlist date as a row in data
        final_sheet[0].append(format_date(playlist['date']))
    for track in sheet: # formats the name of the title in the chart and adds the track image for future purposes
        # logging.info(track['name'])
        track_color = get_color(track['image'])
        column = [{
            "name": track['name'],
            "artists": track['artists'],
            "image": track['image'],
            "color": track_color
        }]
        column.extend(track[attribute])
        final_sheet.append(column)
    logging.info("Finished creating sheet")
    return final_sheet

