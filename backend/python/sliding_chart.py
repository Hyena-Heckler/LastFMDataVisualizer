from manim import *

class CenterRevealChart(Scene):
    def construct(self):
        songs = {
            "Song A": [5, 4, 3, 2, 1],
            "Song B": [15, 12, 10, 8, 5],
            "Song C": [14, 14, 13, 11, 9]
        }

        axes = Axes(
            x_range=[0, 8, 1],
            y_range=[0, 16, 1],
            tips=False
        ).to_edge(LEFT)

        self.add(axes)

        colors = [BLUE, RED, GREEN]
        lines = VGroup()

        for i, (song, ranks) in enumerate(songs.items()):
            points = [axes.c2p(x, ranks[x]) for x in range(len(ranks))]
            line = VMobject()
            line.set_points_smoothly(points)
            line.set_stroke(colors[i], width=4)
            lines.add(line)

        # Create a mask rectangle for the reveal
        mask = Rectangle(
            width=axes.c2p(8, 0)[0] - axes.c2p(4, 0)[0],
            height=10,
            fill_opacity=1,
            stroke_opacity=0
        ).move_to(axes.c2p(6, 8))

        self.add(mask)

        # Create clipped lines using Intersection
        clipped_lines = VGroup()
        for line in lines:
            clipped = Intersection(line, mask)
            clipped_lines.add(clipped)

        self.add(clipped_lines)

        # Reveal animation
        self.play(mask.animate.shift(LEFT * (axes.c2p(4, 0)[0] - axes.c2p(0, 0)[0])), run_time=6)
        self.wait()
