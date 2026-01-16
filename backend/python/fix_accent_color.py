from PIL import Image
import requests
from io import BytesIO
import json
import sys
import random
from colorthief import ColorThief
import logging

"""

    could make a saturate option (remove and separate from color_separate)
    streamline processes, so I don't have to hit run on three different files
"""

with open('albums_to_colors.json') as f:
    full_albums_to_colors = json.load(f)

for index, track in enumerate(full_albums_to_colors):
    track["common_color"] = [c / 255 for c in track["common_color"]]
    logging.info(index / len(full_albums_to_colors))


with open('albums_to_colors.json', 'w') as f:
    json.dump(full_albums_to_colors, f, indent=2)