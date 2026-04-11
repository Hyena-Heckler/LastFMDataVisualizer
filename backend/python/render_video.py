import numpy as np
import matplotlib
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib.animation import FFMpegWriter
from matplotlib import font_manager
from datetime import datetime
import time
import json
import sys
import os

import logging

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stderr,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def setup_font(background_color):
    # changes the font
    BASE_DIR = os.path.dirname(__file__)
    font_path = os.path.join(BASE_DIR, "fonts", "NotoSansJP-Bold.ttf")
    font_manager.fontManager.addfont(font_path)
    prop = font_manager.FontProperties(fname=font_path)
    plt.rcParams['font.family'] = 'fantasy'  # or sans-serif or monospace
    plt.rcParams['font.fantasy'] = prop.get_name()
    plt.rcParams['axes.facecolor'] = background_color  # changes color to black
    plt.rcParams['figure.facecolor'] = background_color  # changes color to black

def setup_antialiases():
    # helps improve speed
    plt.rcParams['lines.antialiased'] = False
    plt.rcParams['patch.antialiased'] = False

def setup_axes(days, num_positions_shown, graph_color):
    # Basic Structure of the Figure
    fig = plt.figure(figsize=(10, 5))  # creates plot
    plot_frame = fig.add_axes((0.1, 0.1, .8, .8))  # actually frame data
    plot_data = fig.add_axes((0.1, 0.1, .4, .8))  # adds labels

    # Plot for the data
    plot_data.set_ylim([.5, num_positions_shown + .5])  # range for the y values displayed
    plot_data.invert_yaxis()  # flips axis
    plot_data.axis("off")  # turns off the axis

    # Plot for the frame
    ranks_ticks = list(range(1, num_positions_shown + 1, 1))  # tick marks for positions
    plot_frame.set_ylim([.5, num_positions_shown + .5])  # range for the y values displayed
    plot_frame.set_yticks(ranks_ticks, minor=False)  # shows ticks for the range
    plot_frame.set_yticklabels(ranks_ticks, fontdict=None, minor=False, color='#1db954',
                               fontsize=22)  # shows labels for the ticks
    plot_frame.plot(days, np.full_like(days, 0))  # plots data outside of range to have an x axis
    plot_frame.xaxis.tick_top()  # moves x ticks to the top
    plot_frame.spines["top"].set_color(graph_color)  # changes color to green
    plot_frame.spines["bottom"].set_color(graph_color)  # changes color to green
    plot_frame.spines["left"].set_color(graph_color)  # changes color to green
    plot_frame.spines["right"].set_color(graph_color)  # changes color to green
    plot_frame.yaxis.label.set_color(graph_color)  # changes color to green
    plot_frame.xaxis.label.set_color(graph_color)  # changes color to green
    plot_frame.tick_params(axis='x', colors=graph_color)  # changes color to green
    plot_frame.tick_params(axis='y', colors=graph_color)  # changes color to green
    plot_frame.set_xlabel('Dates', weight='bold')  # label for the x axis
    plot_frame.xaxis.set_label_position('top')  # moves the x axis label to the top
    plot_frame.invert_yaxis()  # flips y-axis

    return fig, plot_frame, plot_data

def build_days(days, intro_outro_length):
    # Plot for data
    for i, day in enumerate(days):  # adds days as x values starting at 0
        days[i] = i
    for _ in range(0, 2 * intro_outro_length):  # adds intro and outro days
        days.append(days[len(days) - 1] + 1)  # days extending the current set
    return days

def create_smooth_lines(song, intro_outro_length):
    ranks = song[1:]  # ranking positions of all songs without extra information
    ranks = (
        [ranks[0]] * intro_outro_length
        + [np.nan if pos is None else pos for pos in ranks]
        + [ranks[-1]] * intro_outro_length
    )
    return np.array(ranks, dtype=float)

def create_points(song, intro_outro_length):
    point_days, point_ranks = [], []  # array for the dates that are points, array for positions of those points

    for i in range(len(song) - 4):  # goes through the positions in the middle
        if song[i + 1] is None and song[i + 2] is not None and song[
            i + 3] is None:  # checks to see if the days before and after are None
            point_days.append(intro_outro_length + i + 1)  # adds the day and the position to the graph
            point_ranks.append(song[i + 2])

    return point_days, point_ranks

def create_text(text_labels, plot_data, graph_color, song, song_id):
    text = plot_data.text(
        0, 0,
        song[0]["name"],
        color=graph_color,
        ha="left",
        va="center",
        clip_on=False
    )
    text.set_visible(False)
    text_labels[song_id] = text

def graph_data(data):
    # Annotation Variable
    ann_x_shift = 0
    ann_y_shift = 0

    # controllable
    speed_per_date = 15  # int(input("Enter a number for the smoothness of graph (15 fps): "))  # frame rate
    intro_outro_length = 1  # int(input("Enter a number for the length of intro/outro: "))  # how long it goes into and out of the charts for
    background_color = "#1db954"  # defaults to green
    graph_color = "#191414"  # defaults to black
    num_positions_shown = 15  # input("How much positions do you want to be shown?: ")
    num_positions_shown = int(num_positions_shown)

    setup_font(background_color)
    setup_antialiases()
    days = data[0][1:].copy()  # all dates

    fig, plot_frame, plot_data = setup_axes(days, num_positions_shown, graph_color)
    days = build_days(days, intro_outro_length)

    text_labels = {}

    for song_id, song in enumerate(data[1:]):
        # lines
        ranks = create_smooth_lines(song, intro_outro_length)
        plot_data.plot(days, ranks, lw=3, color = song[0]["color"])  # creates the lines in graph

        # points
        point_days, point_ranks  = create_points(song, intro_outro_length)
        plot_data.plot(point_days, point_ranks, 'o')  # creates the points with 'o' making it not  a line graph

        # annotations
        create_text(text_labels, plot_data, graph_color, song, song_id)



    total_frames = speed_per_date * (len(days) - 1) - intro_outro_length + 1
    def animate(frame):
        xdist_per_date = frame / speed_per_date  # adjusts speed to take X frames to reach the next day
        plot_data.set_xlim([xdist_per_date - 3.5, xdist_per_date])  # actually data points
        plot_frame.set_xlim([xdist_per_date - 3.5 - intro_outro_length,
                             xdist_per_date + 3.5 - intro_outro_length])  # frame that changes the labels

        last_graph_date_value = int(np.floor(xdist_per_date))  # last actual playlist date
        next_graph_date_value = int(np.ceil(xdist_per_date))  # next actual playlist date

        # progress meter
        current_percentage = (frame * 100) // total_frames
        previous_percentage = ((frame - 1) * 100) // total_frames
        if current_percentage != previous_percentage:
            logging.info(f"{current_percentage}%")

        previous_value = last_graph_date_value - intro_outro_length
        next_value = next_graph_date_value - intro_outro_length
        for song_id, song in enumerate(data[1:]):  # goes through every song in data for labels
            song_label = text_labels[song_id]
            # checks to see if the current date (previous_value) is in the initial date or before
            if next_value <= 0:  # checks to see if it has not started yet
                if song[1] is not None and song[1] <= 15:  # if the intro song's position is on the charts, plot  it
                    song_label.set_position((xdist_per_date + ann_x_shift, song[1] + ann_y_shift))
                    song_label.stale = True
                    song_label.set_visible(True)
            # checks to see if the current data (previous_value) is in the final date or over
            elif previous_value >= len(song) - 2:
                if song[-1] is not None and song[-1] <= 15:  # if the intro song's position is on the charts, plot  it
                    song_label.set_position((xdist_per_date + ann_x_shift, song[-1] + ann_y_shift))
                    song_label.set_visible(True)
            # math using slope and the distance from the closest point to the left to determine where it should be
            elif (next_value + 1 < len(song) and song[next_value] is not None and
                  song[next_value + 1] is not None and
                  (song[next_value] <= 15 or song[next_value + 1] <= 15)):
                ydist_per_date = song[next_value + 1] + (song[next_value] - song[next_value + 1]) * (
                         next_graph_date_value - xdist_per_date)
                if ydist_per_date <= 15:
                    song_label.set_position((xdist_per_date + ann_x_shift, ydist_per_date + ann_y_shift))
                    song_label.set_visible(True)
                else:
                    song_label.set_visible(False)
            # checks to see if it is a single point
            elif xdist_per_date - intro_outro_length == next_value < len(song) - 1 and song[next_value + 1] is not None and song[next_value + 1] <= 15:
                song_label.set_position((xdist_per_date + ann_x_shift, song[next_value + 1] + ann_y_shift))
                song_label.set_visible(True)
            elif song_label.get_position()[0] < xdist_per_date - 3.5:
                song_label.set_visible(False)

    ani = animation.FuncAnimation(fig, animate, frames=total_frames,  blit=False, interval=1)  # how long it lasts in relation to the framerate and number of days

    # TURNS IT INTO A VIDEO
    t2 = time.perf_counter()
    metadata = dict(Title='Color Chart', artist='harshshetty')  # data for the file
    writer = FFMpegWriter(
        fps=speed_per_date / 2,
        metadata=metadata
    )  # creates the file

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    ani.save(f"python/videos/{timestamp}.mp4", writer=writer)  # creates a video for song chart
    t3 = time.perf_counter()
    # print(f"Video render time: {t3 - t2:.2f}s")
    # Packing all the plots and displaying them

    with open("python/render_efficiency.json", "r") as f:
        data = json.load(f)

    data.append({
        "fps": f"{total_frames / (t3 - t2):.2f}",
        "time": f"{t3 - t2:.2f}s",
        "rendered_frames": total_frames,
        "timestamp": datetime.now().isoformat()

    })

    with open("python/render_efficiency.json", "w") as f:
        json.dump(data, f, indent=2)

    #plt.show()

