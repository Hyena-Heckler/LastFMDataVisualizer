import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib.animation import FFMpegWriter
from matplotlib import font_manager

# Annotation Variable
ann_list = []  # list of all song titles
ann_x_shift = 0.05
ann_y_shift = 0.2

# controllable
speed_per_date = 15 # int(input("Enter a number for the smoothness of graph (15 fps): "))  # frame rate
intro_outro_length = 3 # int(input("Enter a number for the length of intro/outro: "))  # how long it goes into and out of the charts for
background_color = "#1db954" # defaults to green
graph_color = "#191414"  # defaults to black
kind_of_chart = "songs" #input("Do you want to view songs or artists chart? (songs/artists/albums): ")  # switches between artist and song chart
num_positions_shown = 15 #input("How much positions do you want to be shown?: ")
num_positions_shown = int(num_positions_shown)

# changes the font
font_path = '/Users/harshshetty/Desktop/Python/Spot/tutorial-env/NotoSansJP-Bold.ttf'  # Your font path goes here
font_manager.fontManager.addfont(font_path)
prop = font_manager.FontProperties(fname=font_path)
plt.rcParams['font.family'] = 'fantasy'  # or sans-serif or monospace
plt.rcParams['font.fantasy'] = prop.get_name()
plt.rcParams['axes.facecolor'] = background_color  # changes color to black
plt.rcParams['figure.facecolor'] = background_color  # changes color to black

def graph_data(data):
    days = data[0][4:]  # all dates

    ranks_ticks = list(range(1, num_positions_shown + 1, 1))  # tick marks for positions

    # Basic Structure of the Figure
    fig = plt.figure(figsize=(10, 5))  # creates plot
    plot_frame = fig.add_axes((0.1, 0.1, .8, .8))  # actually frame data
    plot_data = fig.add_axes((0.1, 0.1, .4, .8))  # adds labels

    # Plot for the data
    plot_data.set_ylim([.5, num_positions_shown + .5])  # range for the y values displayed
    plot_data.invert_yaxis()  # flips axis
    plot_data.axis("off")  # turns off the axis

    # Plot for the frame
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

    # Plot for data
    for i, day in enumerate(days):  # adds days as x values starting at 0
        days[i] = i
    for x in range(0, 2 * intro_outro_length):  # adds intro and outro days
        days.append(days[len(days) - 1] + 1)  # days extending the current set

    for song in data[1:]:
        # lines
        ranks = song[4:]  # ranking positions of all songs without extra information
        rank_initial = ranks[0]  # first value of rank (could probably incorporate in
        for x in range(0, intro_outro_length):
            ranks.insert(0, rank_initial)
            ranks.append(ranks[len(ranks) - 1])
        plot_data.plot(days, ranks, lw=3, color = song[3])  # creates the lines in graph

        # points
        point_days = []  # array for the dates that are points
        point_ranks = []  # array for positions of those points

        for i, position in enumerate(song[4:len(song) - 2]):  # goes through the positions in the middle
            if song[i + 3] is None and song[i + 4] is not None and song[
                i + 5] is None:  # checks to see if the days before and after are None
                point_days.append(intro_outro_length + i + 1)  # adds the day and the position to the graph
                point_ranks.append(song[i + 4])

        plot_data.plot(point_days, point_ranks, 'o')  # creates the points with 'o' making it not  a line graph

    def animate(frame):
        xdist_per_date = frame / speed_per_date  # adjusts speed to take X frames to reach the next day
        plot_data.set_xlim([xdist_per_date - 3.5, xdist_per_date])  # actually data points
        plot_frame.set_xlim([xdist_per_date - 3.5 - intro_outro_length,
                             xdist_per_date + 3.5 - intro_outro_length])  # frame that changes the labels

        graph_date_value = int(np.floor(xdist_per_date))  # last actual playlist date

        for j, a in enumerate(ann_list):
            a.remove()  # deletes all the annotated point labels
        ann_list[:] = []  # list of all the annotated point labels is a blank array (MAYBE DELETE THE FOR LOOP THEN)

        previous_value = graph_date_value - intro_outro_length
        for track in data[1:]:  # goes through every track in data
            if previous_value >= len(
                    track) - 4:  # checks to see if the current data (previous_value) is in the final date or over
                if track[len(track) - 1] is not None:  # if the final track's position is on the charts, plot  it
                    ann = plot_data.annotate(track[0], (xdist_per_date, track[len(track) - 1] + ann_y_shift),
                                             color=graph_color)
                    ann_list.append(ann)
            # checks to see if the two dates around the data point exist
            elif previous_value <= -1:  # checks to see if it has not started yet
                if track[4] is not None:  # if the intro track's position is on the charts, plot  it
                    ann = plot_data.annotate(track[0], (xdist_per_date, track[4] + ann_y_shift), color=graph_color)
                    ann_list.append(ann)
            elif track[previous_value + 4] is not None and track[previous_value + 5] is not None and (
                    track[previous_value + 4] <= 15 or track[previous_value + 5] <= 15):
                # math using slope and the distance from the closest point to the left to determine where it should be
                ydist_per_date = track[previous_value + 4] + (track[previous_value + 5] - track[previous_value + 4]) * (
                        xdist_per_date - graph_date_value)
                ann = plot_data.annotate(track[0], (xdist_per_date, ydist_per_date + ann_y_shift),
                                         color=graph_color)  # plots the annotated point labels
                ann_list.append(ann)  # adds it to a list
            else:  # checks to see if it is a point before plotting
                for j, rank in enumerate(reversed(track[4:previous_value + 4])):  # traverses track positions backwards
                    # if position exists, higher than 15, and the next position doesn't exist, this occurs
                    if rank is not None and rank <= 15 and track[previous_value + 5 - j] is None:
                        ann = plot_data.annotate(track[0],
                                                 (
                                                     previous_value + intro_outro_length - j + ann_x_shift,
                                                     rank + ann_y_shift),
                                                 color=graph_color)  # plots the annotated point labels
                        ann_list.append(ann)  # adds it to a list
                        break  # avoids duplicates


    ani = animation.FuncAnimation(fig, animate, frames=speed_per_date * (
        len(days)) - intro_outro_length + 1)  # how long it lasts in relation to the framerate and number of days

    # TURNS IT INTO A VIDEO
    metadata = dict(Title='Color Chart', artist='harshshetty')  # data for the file
    writer = FFMpegWriter(fps=speed_per_date / 2, metadata=metadata)  # creates the file
    # if turn_to_video == "y":
    #     if kind_of_chart == "songs":
    #         ani.save("songs_chart.mp4", writer=writer)  # creates a video for song chart
    #     elif kind_of_chart == "artists":
    #         ani.save("artist_chart.mp4", writer=writer)  # creates a video for artist chart
    #     elif kind_of_chart == "albums":
    #         ani.save("albums_chart.mp4", writer=writer)  # creates a video for album chart

    # Packing all the plots and displaying them
    plt.show()
