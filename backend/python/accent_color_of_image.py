from PIL import Image
import requests
from io import BytesIO
import json
import random

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


def compressed_image(pixel_map, image_width, image_height, pixel_block=64):
    compressed_img = Image.new(mode="RGB", size=(int(image_width / pixel_block), int(image_height / pixel_block)))
    pix = compressed_img.load()

    for i in range(0, int(image_width / pixel_block)):
        for j in range(0, int(image_height / pixel_block)):
            r = 0
            g = 0
            b = 0
            for i_2 in range(i * pixel_block, i * pixel_block + pixel_block):
                for j_2 in range(j * pixel_block, j * pixel_block + pixel_block):
                    colors = pixel_map[i_2, j_2]
                    r += colors[0]
                    g += colors[1]
                    b += colors[2]
            r /= pixel_block ** 2
            g /= pixel_block ** 2
            b /= pixel_block ** 2
            pix[i, j] = (int(r), int(g), int(b))

    return pix, compressed_img.width, compressed_img.height


def rgb_mapped_with_frequency(pixel_map, image_width, image_height):
    all_color_rgb = []
    for i in range(0, image_width):
        for j in range(0,
                       image_height):  # goes through every pixel and adds the rgb values divided by # of pixels
            colors = pixel_map[i, j]
            all_color_rgb.append(colors)

    unique_all_color_rgb = list(set(all_color_rgb))
    distribution_dots = [[], [], [], []]

    for unique_color in unique_all_color_rgb:
        distribution_dots[0].append(unique_color[0])
        distribution_dots[1].append(unique_color[1])
        distribution_dots[2].append(unique_color[2])
        count = 0
        length_of_colors = len(all_color_rgb)
        for j in range(0, length_of_colors):
            index = length_of_colors - j - 1
            if unique_color == all_color_rgb[index]:
                count += 1
                all_color_rgb.pop(index)
        distribution_dots[3].append(count)
    return distribution_dots


def rgb_to_hsl(r, g, b):
    lightness = (max(r, g, b) + min(r, g, b))/2
    chroma = max(r, g, b) - min(r, g, b)

    if chroma == 0:
        hue = 0
    elif max(r, g, b) == r:
        hue = 60 * (((g - b) / chroma) % 6)
    elif max(r, g, b) == g:
        hue = 60 * (((b - r) / chroma) + 2)
    else:
        hue = 60 * (((r - g) / chroma) + 4)

    if chroma == 0:
        saturation = 0
    else:
        saturation = (max(r, g, b) - lightness) / min(lightness, 1 - lightness)

    return hue, saturation, lightness


def hsl_to_rgb(hue, saturation, lightness):
    chroma = (1 - abs(2 * lightness - 1)) * saturation
    hue_simplified = hue / 60
    intermediate_value = chroma * (1 - abs(hue_simplified % 2 - 1))

    if hue_simplified < 1:
        r, g, b = chroma, intermediate_value, 0
    elif hue_simplified < 2:
        r, g, b = intermediate_value, chroma, 0
    elif hue_simplified < 3:
        r, g, b = 0, chroma, intermediate_value
    elif hue_simplified < 4:
        r, g, b = 0, intermediate_value, chroma
    elif hue_simplified < 5:
        r, g, b = intermediate_value, 0, chroma
    else:
        r, g, b = chroma, 0, intermediate_value

    match_lightness = lightness - chroma/2

    return r + match_lightness, g + match_lightness, b + match_lightness


def average_color(pixel_map, image_width, image_height):
    average_color_rgb = [0.0, 0.0, 0.0]  # contains the average color

    for i in range(0, image_width):
        for j in range(0, image_height):  # goes through every pixel and adds the rgb values divided by # of pixels
            colors = pixel_map[i, j]
            average_color_rgb[0] += float(colors[0]) / (image_width * image_height)
            average_color_rgb[1] += float(colors[1]) / (image_width * image_height)
            average_color_rgb[2] += float(colors[2]) / (image_width * image_height)

    return int(average_color_rgb[0]), int(average_color_rgb[1]), int(average_color_rgb[2])  # tuple


def common_color_separated(pixel_map, image_width, image_height, tolerance=20):
    all_color_rgb = [[0], [0], [0]]

    for i in range(0, 256):
        all_color_rgb[0].append(0)
        all_color_rgb[1].append(0)
        all_color_rgb[2].append(0)

    for i in range(0, image_width):
        for j in range(0, image_height):  # goes through every pixel and adds the rgb values divided by # of pixels
            colors = pixel_map[i, j]
            all_color_rgb[0][colors[0]] += 1
            all_color_rgb[1][colors[1]] += 1
            all_color_rgb[2][colors[2]] += 1

    frequency = [[], [], []]
    for i in range(0, 256 - tolerance * 2):
        sum_r = 0
        sum_g = 0
        sum_b = 0
        for j in range(i, i + tolerance * 2 + 1):
            sum_r += all_color_rgb[0][j]
            sum_g += all_color_rgb[1][j]
            sum_b += all_color_rgb[2][j]
        frequency[0].append(sum_r)
        frequency[1].append(sum_g)
        frequency[2].append(sum_b)

    largest_r_frequency = sorted(frequency[0], key=None, reverse=True)[0]
    largest_g_frequency = sorted(frequency[1], key=None, reverse=True)[0]
    largest_b_frequency = sorted(frequency[2], key=None, reverse=True)[0]

    common_r = frequency[0].index(largest_r_frequency) + tolerance
    common_g = frequency[1].index(largest_g_frequency) + tolerance
    common_b = frequency[2].index(largest_b_frequency) + tolerance

    # # shifts the extremes towards the ends
    # if common_r > common_g > common_b:
    #     common_r = (255 - common_r) / 2 + common_r
    #     common_b = common_b - (common_b - 0) / 2
    # elif common_r > common_b > common_g:
    #     common_r = (255 - common_r) / 2 + common_r
    #     common_g = common_g - (common_g - 0) / 2
    # elif common_b > common_g > common_r:
    #     common_b = (255 - common_b) / 2 + common_b
    #     common_r = common_r - (common_r - 0) / 2
    # elif common_b > common_r > common_g:
    #     common_b = (255 - common_b) / 2 + common_b
    #     common_g = common_g - (common_g - 0) / 2
    # elif common_g > common_r > common_b:
    #     common_g = (255 - common_g) / 2 + common_g
    #     common_b = common_b - (common_b - 0) / 2
    # elif common_g > common_b > common_r:
    #     common_g = (255 - common_g) / 2 + common_g
    #     common_r = common_r - (common_r - 0) / 2

    return common_r, common_g, common_b


def three_d_radius(pixel_map, image_width, image_height, *kwargs):
    compressed_pixel_map, compressed_img_width, compressed_img_height = compressed_image(pixel_map, image_width,
                                                                                         image_height, *kwargs)

    mapped_points = rgb_mapped_with_frequency(compressed_pixel_map, compressed_img_width, compressed_img_height)

    x = mapped_points[0]
    y = mapped_points[1]
    z = mapped_points[2]
    freq = mapped_points[3]
    average_modified_radius = []

    total_dots = compressed_img_width * compressed_img_height

    for i in range(len(mapped_points[3])):
        radius_sum = 0
        for j in range(len(mapped_points[3])):
            if i != j:
                diff_x = (x[i] - x[j]) ** 2
                diff_y = (y[i] - y[j]) ** 2
                diff_z = (z[i] - z[j]) ** 2
                total_radius = (diff_x + diff_y + diff_z) ** (1 / 2)
                radius_sum += total_radius * freq[j]
        average_modified_radius.append(radius_sum / (total_dots - 1))

    best_color_index = average_modified_radius.index(min(average_modified_radius))
    return x[best_color_index], y[best_color_index], z[best_color_index]


def three_d_common_color(pixel_map, image_width, image_height, tolerance = 20, *kwargs):
    compressed_pixel_map, compressed_img_width, compressed_img_height = compressed_image(pixel_map, image_width,
                                                                                         image_height, *kwargs)

    mapped_points = rgb_mapped_with_frequency(compressed_pixel_map, compressed_img_width, compressed_img_height)

    x = mapped_points[0]
    y = mapped_points[1]
    z = mapped_points[2]
    freq = mapped_points[3]
    neighbor_dots = []

    for i in range(len(mapped_points[3])):
        radius_sum = 0
        for j in range(len(mapped_points[3])):
            if i != j:
                diff_x = (x[i] - x[j]) ** 2
                diff_y = (y[i] - y[j]) ** 2
                diff_z = (z[i] - z[j]) ** 2
                total_radius = (diff_x + diff_y + diff_z) ** (1 / 2)
                if total_radius < tolerance:
                    radius_sum += freq[j]
        neighbor_dots.append(radius_sum)

    best_color_index = neighbor_dots.index(max(neighbor_dots))
    return x[best_color_index], y[best_color_index], z[best_color_index]


def get_color(function, artwork="", is_link=True, force_run = False, is_saturated = False, saturation_level = 1.5, *kwargs):
    with open('albums_to_colors.json') as f:  # collects data from on_repeat_history
        full_albums_to_colors = json.load(f)


    if is_link and get_index(full_albums_to_colors, artwork) > -1 and not force_run:
        return full_albums_to_colors[get_index(full_albums_to_colors, artwork)]['common_color']
    else:
        if is_link:  # either takes the images from the link or directly gets the image
            response = requests.get(artwork)
            img = Image.open(BytesIO(response.content))
        else:
            img = Image.open(artwork)

        img = img.convert('RGB')

        pix = img.load()  # pixels

        artwork_color = function(pix, img.width, img.height, *kwargs)
        artwork_color = [art / 255 for art in artwork_color]
        if is_saturated:
            hsl_code = rgb_to_hsl(*artwork_color)
            hsl_saturated = hsl_code[0], min(hsl_code[1] * saturation_level, 1), hsl_code[2]
            artwork_color = hsl_to_rgb(*hsl_saturated)
        # artwork_color = [art * 255 for art in artwork_color] # only for when creating palettes
        # artwork_color = [int(art) for art in artwork_color]
        artwork_color = [max(0,min(1, art)) for art in artwork_color]

        full_albums_to_colors.append(Album(artwork, (artwork_color[0], artwork_color[1], artwork_color[2])).__dict__)

        with open('albums_to_colors.json', 'w') as f:
            json.dump(full_albums_to_colors, f, indent=2)
        print(artwork_color[0], artwork_color[1], artwork_color[2])
        return artwork_color[0], artwork_color[1], artwork_color[2]


if __name__ == '__main__':
    img  = Image.open("Saturn.png")
    width, height = img.size
    pixel_map = img.load()
    bar_length = 10
    for i in range(0, width):
        for j in range(0, height):
            color = 0
            if pixel_map[i, j][0] < 127:
                color = int((int((i/10 * j/10)) ^ int((i/10))) % 256)
            else:
                color = int(((i * 5000) / (j + 1)) % 16) * 16
            pixel_map[i, j] = (color, color, color)


    img.save("Updated Saturn.png")

if __name__ == '__inverse_spots__':
    img  = Image.open("alive_parrot.png")
    width, height = img.size
    pixel_map = img.load()
    inverse_spots = []

    for n in range(25):
        rwidth = random.randrange(0, width, 1)
        rheight = random.randrange(0, height, 1)
        rradius = random.expovariate(1.5) * 30 + 1
        inverse_spots.append((rwidth, rheight, rradius))

    previous = 100

    for i in range(0, width):
        for j in range(0, height):
            for inverse in inverse_spots:
                d = ((i - inverse[0]) ** 2 + (j - inverse[1]) ** 2) ** (1/2)
                if d < inverse[2]:
                    pixel_map[i, j] = (255 - pixel_map[i, j][0], 255 - pixel_map[i, j][1], 255 - pixel_map[i, j][2])
                    break

            progress = round((i*height+j)/(width*height) * 100.0, 1)
            if progress != previous:
                print(progress)
                previous=progress

    img.save("inverse_spotted_alive_parrot.png")

if __name__ == '__something_pattern__':
    img  = Image.open("alive_parrot.png")
    width, height = img.size
    pixel_map = img.load()
    inverse_spots = []

    rwidth = random.randrange(-40, 40, 1)
    rheight = random.randrange(-40, 40, 1)
    n = 0
    inverse_spots.append((rwidth, rheight, n, []))

    for n in range(25):
        rwidth = random.randrange(-40, 40, 1)
        rheight = random.randrange(-40, 40, 1)
        n = 0
        inverse_spots.append((rwidth, rheight, n, []))

    previous = 100

    for i in range(0, width):
        for j in range(0, height):
            for inverse in inverse_spots:
                d = ((i - inverse[0]) ** 2 + (j - inverse[1]) ** 2) ** (1/2)
                if d < inverse[2]:
                    pixel_map[i, j] = (255 - pixel_map[i, j][0], 255 - pixel_map[i, j][1], 255 - pixel_map[i, j][2])
                    break

            progress = round((i*height+j)/(width*height) * 100.0, 1)
            if progress != previous:
                print(progress)
                previous=progress

    img.save("inverse_spotted_alive_parrot.png")

if __name__ == '__maain__': #TEMPORARILY DISABLED
    album_covers = [
        "https://i.scdn.co/image/ab67616d0000b273d0465446a53e2bba2d1fd87f",  #pay attention (character development)
        "https://i.scdn.co/image/ab67616d0000b273651e1dbc0b5218f2306181a1",  #pink friday girls (pink friday 2)
        "https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a",  #jealousy, jealous (sour)
        "https://i.scdn.co/image/ab67616d0000b273691253f50c8d0c3a2d52363f",  #crush (bad ideas)
        "https://i.scdn.co/image/ab67616d0000b273fa747621a53c8e2cc436dee0",  #yoyok (midnights 3 am)
        "https://i.scdn.co/image/ab67616d0000b27355a1e72ba425c60a02a9bb47",   # sympathy is a knife (brat)
        "https://i.scdn.co/image/ab67616d0000b2738ecc33f195df6aa257c39eaa", # but daddy, I love him (the anthology)
        "https://i.scdn.co/image/ab67616d0000b273fd8d7a8d96871e791cb1f626", # good graces (short n sweet)
        "https://i.scdn.co/image/ab67616d0000b273fbab613f887083f7ee11a1de", # renegade (how long do you think it'll last?)
        "https://i.scdn.co/image/ab67616d0000b273bb7ef31b81938dc605b9f2fa", # northwest zombie girl (wall socket deluxe)
        "https://i.scdn.co/image/ab67616d0000b273df51a3d66223e5b01813e0c4" # top ten statues that cried (post human: nex gen)
    ]

    pixel_grouped_square = 5
    pixel_frame_size = int(640/pixel_grouped_square + (640/pixel_grouped_square) % 2)

    comparison_img = Image.new(mode="RGB", size=(pixel_frame_size * len(album_covers), pixel_frame_size * 9))
    comparison_pixel_map = comparison_img.load()

    for album_cover_int, album_cover in enumerate(album_covers):
        specific_response = requests.get(album_cover)
        album_img = Image.open(BytesIO(specific_response.content))
        album_img = album_img.convert('RGB')

        album_pix = album_img.load()  # pixels


        compressed_album_pixel_map, compressed_album_img_width, compressed_album_img_height = (
            compressed_image(album_pix, album_img.width, album_img.height, pixel_block=pixel_grouped_square))

        average_color_set = get_color(average_color, album_cover, force_run=True)
        low_saturated_average_color_set = get_color(average_color, album_cover, force_run=True, is_saturated = True)
        medium_saturated_average_color_set = get_color(average_color, album_cover, force_run=True, is_saturated=True,
                                                       saturation_level=2)
        high_saturated_average_color_set = get_color(average_color, album_cover, force_run=True, is_saturated=True,
                                                     saturation_level=3)
        ultra_high_saturated_average_color_set = get_color(average_color, album_cover, force_run=True,
                                                           is_saturated=True,
                                                           saturation_level=4)

        common_color_separated_set = get_color(common_color_separated, album_cover, force_run=True)
        low_saturated_common_color_separated_set = get_color(common_color_separated, album_cover, force_run=True,
                                                             is_saturated=True)
        medium_saturated_common_color_separated_set = get_color(common_color_separated, album_cover, force_run=True,
                                                                is_saturated=True, saturation_level=2)
        high_saturated_common_color_separated_set = get_color(common_color_separated, album_cover, force_run=True,
                                                              is_saturated=True, saturation_level=3)
        ultra_high_saturated_common_color_separated_set = get_color(common_color_separated, album_cover, force_run=True,
                                                                    is_saturated=True, saturation_level=4)

        three_d_radius_set = get_color(three_d_radius, album_cover, force_run=True)
        low_saturated_three_d_radius_set = get_color(three_d_radius, album_cover, force_run=True, is_saturated = True)
        medium_saturated_three_d_radius_set = get_color(three_d_radius, album_cover, force_run=True, is_saturated=True, saturation_level=2)
        high_saturated_three_d_radius_set = get_color(three_d_radius, album_cover, force_run=True, is_saturated=True,
                                                        saturation_level=3)
        ultra_high_saturated_three_d_radius_set = get_color(three_d_radius, album_cover, force_run=True, is_saturated=True,
                                                        saturation_level=4)

        three_d_common_color_set = get_color(three_d_common_color, album_cover, force_run=True)
        low_saturated_three_d_common_color_set = get_color(three_d_common_color, album_cover, force_run=True, is_saturated=True)
        medium_saturated_three_d_common_color_set = get_color(three_d_common_color, album_cover, force_run=True, is_saturated=True,
                                                        saturation_level=2)
        high_saturated_three_d_common_color_set = get_color(three_d_common_color, album_cover, force_run=True, is_saturated=True,
                                                      saturation_level=3)
        ultra_high_saturated_three_d_common_color_set = get_color(three_d_common_color, album_cover, force_run=True,
                                                            is_saturated=True,
                                                            saturation_level=4)

        for i_test in range(0, pixel_frame_size):
            comparison_i = i_test + album_cover_int * pixel_frame_size
            for j_test in range(0, pixel_frame_size):
                comparison_pixel_map[comparison_i, j_test] = compressed_album_pixel_map[i_test, j_test]
            for j_test in range(pixel_frame_size, pixel_frame_size * 2):
                comparison_pixel_map[comparison_i, j_test] = average_color_set
            for j_test in range(pixel_frame_size * 2, pixel_frame_size * 3):
                if comparison_i % pixel_frame_size < pixel_frame_size/2 and j_test % pixel_frame_size < pixel_frame_size/2:
                    comparison_pixel_map[comparison_i, j_test] = low_saturated_average_color_set
                elif comparison_i % pixel_frame_size >= pixel_frame_size/2 and j_test % pixel_frame_size < pixel_frame_size/2:
                    comparison_pixel_map[comparison_i, j_test] = medium_saturated_average_color_set
                elif comparison_i % pixel_frame_size < pixel_frame_size/2 and j_test % pixel_frame_size >= pixel_frame_size/2:
                    comparison_pixel_map[comparison_i, j_test] = high_saturated_average_color_set
                else:
                    comparison_pixel_map[comparison_i, j_test] = ultra_high_saturated_average_color_set
            for j_test in range(pixel_frame_size * 3, pixel_frame_size * 4):
                comparison_pixel_map[comparison_i, j_test] = common_color_separated_set

            for j_test in range(pixel_frame_size * 4, pixel_frame_size * 5):
                if comparison_i % pixel_frame_size < pixel_frame_size/2 and j_test % pixel_frame_size < pixel_frame_size/2:
                    comparison_pixel_map[comparison_i, j_test] = low_saturated_common_color_separated_set
                elif comparison_i % pixel_frame_size >= pixel_frame_size/2 and j_test % pixel_frame_size < pixel_frame_size/2:
                    comparison_pixel_map[comparison_i, j_test] = medium_saturated_common_color_separated_set
                elif comparison_i % pixel_frame_size < pixel_frame_size/2 and j_test % pixel_frame_size >= pixel_frame_size/2:
                    comparison_pixel_map[comparison_i, j_test] = high_saturated_common_color_separated_set
                else:
                    comparison_pixel_map[comparison_i, j_test] = ultra_high_saturated_common_color_separated_set
            for j_test in range(pixel_frame_size * 5, pixel_frame_size * 6):
                comparison_pixel_map[comparison_i, j_test] = three_d_radius_set
            for j_test in range(pixel_frame_size * 6, pixel_frame_size * 7):
                if comparison_i % pixel_frame_size < pixel_frame_size/2 and j_test % pixel_frame_size < pixel_frame_size/2:
                    comparison_pixel_map[comparison_i, j_test] = low_saturated_three_d_radius_set
                elif comparison_i % pixel_frame_size >= pixel_frame_size/2 and j_test % pixel_frame_size < pixel_frame_size/2:
                    comparison_pixel_map[comparison_i, j_test] = medium_saturated_three_d_radius_set
                elif comparison_i % pixel_frame_size < pixel_frame_size/2 and j_test % pixel_frame_size >= pixel_frame_size/2:
                    comparison_pixel_map[comparison_i, j_test] = high_saturated_three_d_radius_set
                else:
                    comparison_pixel_map[comparison_i, j_test] = ultra_high_saturated_three_d_radius_set
            for j_test in range(pixel_frame_size * 7, pixel_frame_size * 8):
                comparison_pixel_map[comparison_i, j_test] = three_d_common_color_set
            for j_test in range(pixel_frame_size * 8, pixel_frame_size * 9):
                if comparison_i % pixel_frame_size < pixel_frame_size/2 and j_test % pixel_frame_size < pixel_frame_size/2:
                    comparison_pixel_map[comparison_i, j_test] = low_saturated_three_d_common_color_set
                elif comparison_i % pixel_frame_size >= pixel_frame_size/2 and j_test % pixel_frame_size < pixel_frame_size/2:
                    comparison_pixel_map[comparison_i, j_test] = medium_saturated_three_d_common_color_set
                elif comparison_i % pixel_frame_size < pixel_frame_size/2 and j_test % pixel_frame_size >= pixel_frame_size/2:
                    comparison_pixel_map[comparison_i, j_test] = high_saturated_three_d_common_color_set
                else:
                    comparison_pixel_map[comparison_i, j_test] = ultra_high_saturated_three_d_common_color_set


        print(three_d_radius_set)

    comparison_img.save("comparison_test.png", format="png")
