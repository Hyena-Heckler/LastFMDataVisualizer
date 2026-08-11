import httpx
from PIL import Image
from io import BytesIO
import sys
import asyncio
from colorthief import ColorThief

client = httpx.AsyncClient(
    timeout=10,
    limits=httpx.Limits(
        max_connections=50,
        max_keepalive_connections=20
    )
)

async def get_color(img_link=""):

    if img_link == "null" or img_link is None:
        return (0, 0, 0)

    try:
        response = await client.get(img_link)
        response.raise_for_status()

        image = Image.open(BytesIO(response.content))
        image.thumbnail((100, 100))

        color_thief = ColorThief(BytesIO(
            image.convert("RGB").tobytes()
        ))

        dominant_color = await asyncio.to_thread(color_thief.get_color, quality=1)
        
        return [c / 255 for c in dominant_color]

    except Exception as e:
        print(f"Image fetch error for {img_link}: {e}", file=sys.stderr)
        return (0, 0, 0)


    