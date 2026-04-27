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

def get_color(img_link=""):
    try:
        with open('albums_to_colors.json') as f:
            full_albums_to_colors = json.load(f)
    except FileNotFoundError:
        full_albums_to_colors = {}

    if img_link in full_albums_to_colors:

        return full_albums_to_colors[img_link]['common_color']
    else:
        if img_link == "null":
            return (0, 0, 0)
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
        full_albums_to_colors[img_link] = {
            "common_color": normalize_dominant_color
        }
        with open('albums_to_colors.json', 'w') as f:
            json.dump(full_albums_to_colors, f, indent=2)
        return normalize_dominant_color[0], normalize_dominant_color[1], normalize_dominant_color[2]
