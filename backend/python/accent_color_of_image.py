from PIL import Image
import requests
from io import BytesIO
import json
import sys
import random
from colorthief import ColorThief

"""

    could make a saturate option (remove and separate from color_separate)
    streamline processes, so I don't have to hit run on three different files
"""


class Album:  # class for creating the playlist information
    def __init__(self, image, common_color):
        self.image = image
        self.common_color = common_color


def get_index(li, target):
    for index, x in enumerate(li):
        if x['image'] == target:
            return index
    return -1

def get_color(img_link=""):
    try:
        with open('albums_to_colors.json') as f:
            full_albums_to_colors = json.load(f)
    except FileNotFoundError:
        full_albums_to_colors = []

    if get_index(full_albums_to_colors, img_link) > -1:
        return full_albums_to_colors[get_index(full_albums_to_colors, img_link)]['common_color']
    else:
        try:
            response = requests.get(img_link, timeout=10)
            response.raise_for_status()
        except Exception as e:
            print(f"Image fetch error for {img_link}: {e}", file=sys.stderr)
            return (0, 0, 0)

        img = BytesIO(response.content)

        color_thief = ColorThief(img)
        dominant_color = color_thief.get_color(quality=1)
        normalize_dominant_color = [c / 255 for c in dominant_color]
        full_albums_to_colors.append(Album(img_link, normalize_dominant_color).__dict__)

        with open('albums_to_colors.json', 'w') as f:
            json.dump(full_albums_to_colors, f, indent=2)
        return dominant_color[0], dominant_color[1], dominant_color[2]
