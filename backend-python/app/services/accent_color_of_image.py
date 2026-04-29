from PIL import Image
import httpx
from io import BytesIO
import json
import sys
import asyncio
from colorthief import ColorThief

client = httpx.AsyncClient(timeout=10)

async def get_color(img_link=""):

    if img_link == "null":
        return (0, 0, 0)

    try:
        response = await client.get(img_link)
        response.raise_for_status()
    except Exception as e:
        print(f"Image fetch error for {img_link}: {e}", file=sys.stderr)
        return (0, 0, 0)

    img = BytesIO(response.content)

    color_thief = ColorThief(img)
    dominant_color = await asyncio.to_thread(color_thief.get_color, quality=1)

    normalized = [c / 255 for c in dominant_color]

    return normalized