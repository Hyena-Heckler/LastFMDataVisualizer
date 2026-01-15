import json
import datetime
import re
from color_from_image import *


class SongPositions:  # class for creating the playlist information
    def __init__(self, name, artists, image, positions):
        self.name = name
        self.artists = artists
        self.image = image
        self.positions = positions


with open('on_repeat_history.json') as f:  # collects data from on_repeat_history
    playlist_history = json.load(f)


week_start = input("What is the date start [format: (MM/DD/YY)]:")
week_end = input("What is the date end [doesn't include this date] [format: (MM/DD/YY)]:")

for i, partial_week in enumerate(playlist_history):
    if partial_week['date'] == week_start:
        playlist_history = playlist_history[i:]
        break

for i, partial_week in enumerate(playlist_history):
    if partial_week['date'] == week_end:
        playlist_history = playlist_history[:i]
        break

def get_index(li, target):
    for index, x in enumerate(li):
        if x['name'] == target:
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
def access_display_sheet():
    sheet = []
    for playlist in playlist_history:
        column = [format_date(playlist['date'])]
        for song in playlist['songs']:
            column.append(full_title(song))
        sheet.append(column)
    return sheet


# positions of all songs for all dates
def song_position_data(include_none_dates, split_artist = False, max_position_range=30):  # include_none_dates determines if None dates are included in position
    sheet = []  # stores the data

    for index, playlist in enumerate(playlist_history, 1):  # goes through every playlist in on repeat, with an index
        for song in playlist['songs']:  # goes through every song in each playlist
            if get_index(sheet, song['name']) == -1:  # checks to see if song is not in the sheet, only runs if false
                sheet.append(SongPositions(song['name'], song['artists'], song['image'],
                                           []).__dict__)  # adds to sheet the song name, artist, and an array for positions
                if include_none_dates:  # checks to see if given argument is true
                    for i in range(
                            index - 1):  # adds a None value for position for every date prior to the playlist date
                        sheet[get_index(sheet, song['name'])]['positions'].append(None)
            sheet[get_index(sheet, song['name'])]['positions'].append(
                playlist['songs'].index(song) + 1)  # adds the position of playlist to the position key
        if include_none_dates:  # checks to see if given argument is true
            for track in sheet:  # looks at every track in the sheet so far
                if len(track[
                           'positions']) != index:  # if the length does not match index (has one less position), then it adds a None value to position
                    track['positions'].append(None)
    for i, track in enumerate(sheet): # fix this to be reverse
        highest_position = min(pos for pos in track['positions'] if pos is not None)
        if highest_position > max_position_range:
            sheet.pop(i)

    final_sheet = [[None, None, None]] #final sheet returned
    if split_artist:
        final_sheet[0].append(None)
    for playlist in playlist_history: #adds the playlist date as a row in data
        final_sheet[0].append(format_date(playlist['date']))
    for track in sheet: # formats the name of the title in the chart and adds the track image for future purposes
        track_color = get_color(common_color_separated, track['image'], is_saturated=True, saturation_level=3)
        if split_artist:
            column = [track['name'], track['artists'], track['image'], track_color]
        else:
            column = [full_title(track), track['image'], track_color]
        for position in track['positions']:
            column.append(position)
        final_sheet.append(column)

    return final_sheet


if __name__ == '__main__':
    with open('position_history.json', 'w') as f:
        json.dump(song_position_data(True, split_artist = True), f, indent=2)  # records information in new json file
