import { Muxer, ArrayBufferTarget } from "webm-muxer";
import {store} from "../store.js";

function rgbToHsl(r, g, b) {
    r = parseFloat(r);
    g = parseFloat(g);
    b = parseFloat(b);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h, s, l;

    l = (max + min) / 2;
    
    if (max === min) {
        h = 0;
        s = 0;
    } else {
        const d = max - min;

        s = l > 0.5
            ? d / (2 - max - min)
            : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]

}

export function setUpVideo() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const framerate = 30;

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const EPSILON = 0.001;
    const positions = 15;

    const offsetWidth = WIDTH / 9;
    const offsetHeight = HEIGHT / 9;
    const graphWidth = WIDTH / 9 * 7;
    const graphHeight = HEIGHT / 9 * 7;

    const tailendLength = 3;
    const framesPerWeek = 30;  
    const textPadding = 3;
    const fontSize = graphHeight / 20;

    let currentVideoUrl = null;

    async function renderVideo() {
        const canvasContainer = document.getElementById("canvas-container");
        if (currentVideoUrl) {
            URL.revokeObjectURL(currentVideoUrl);
        }

        // Downloads Video
        const target = new ArrayBufferTarget();
        const muxer = new Muxer({
            target,
            video: {
                codec: "V_VP8",
                width: canvas.width,
                height: canvas.height
            }
        });
        
        let data;
        data = store.cache.normalCache.data;
        
        const positionsData = [
            data[0],
            ...data.slice(1).map(songData => [
                songData[0],
                ...songData.slice(1).map(x => x.position)
            ])
        ];

        const dayLabels = positionsData[0].slice(1);
        const totalWeeks = dayLabels.length;

        // Line Creation
        let songLines = [];
        positionsData.slice(1).forEach(song => {
            let points = [];
            song.slice(1).forEach((pos, index) => {
                const point = {
                    x: points.length,
                    y: pos != null 
                        && (
                            pos < positions + 1
                            || (
                                (index < 1 || (song[index] < positions + 1 && song[index] != null)) 
                                || (index + 2 > totalWeeks || (song[index + 2] < positions + 1 && song[index + 2] != null)) 
                            )
                        )
                        ? offsetHeight + ((pos - .5) / positions) * graphHeight
                        : null
                }
                
                if (index === 0 || index === totalWeeks - 1) {
                    for (let i = 0; i < tailendLength; i++) {
                        points.push({
                            x: point.x + i,
                            y: point.y
                        });
                    }
                } else {
                    points.push(point);
                }
            })

            let [h, s, l] = rgbToHsl(...song[0].color)
            l = Math.max(l, 50);
            songLines.push({
                name: song[0]["name"],
                color: `hsl(${h}, ${s}%, ${l}%)`,
                points: points
            })
        })

        ctx.font = `${fontSize}px Arial`;
        ctx.lineWidth = graphHeight / 120;
        const radius = graphHeight / 120;

        function drawFrame(progress) {
            ctx.clearRect(0, 0, WIDTH, HEIGHT);

            // background
            ctx.fillStyle = "#111";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            // songs
            const count = Math.floor(progress / framesPerWeek);
            const transition = progress % framesPerWeek;
            const weekPoints = [];
            const artistLabels = [];

            ctx.save()
            ctx.beginPath();
            ctx.rect(offsetWidth, offsetHeight, graphWidth / 2, graphHeight);
            ctx.clip();
            // Line Drawing
            for (const line of songLines) {
                ctx.beginPath();
                ctx.strokeStyle = line.color;
                ctx.fillStyle = line.color;

                let lastX = null;
                let lastY = null;
                for (let i = Math.max(count-5, 0); i < count + 1; i++) {
                    const point = line.points[i];

                    if (point.y === null) {
                        continue;
                    }

                    const x = (point.x - count + 1 - transition / framesPerWeek) * offsetWidth + WIDTH/2;
                    if (i === Math.max(count-5, 0) || line.points[i - 1]?.y === null) {
                        ctx.moveTo(x, point.y);
                        if (line.points[i + 1]?.y === null && x <= WIDTH/2) {
                            weekPoints.push({
                                color: line.color,
                                x: x,
                                y: point.y
                            })
                        }
                    } else {
                        ctx.lineTo(x, point.y);
                    }
                    
                    lastX = Math.min(x, WIDTH / 2);
                    lastY = point.y;
                    if (i === count) {
                        if (line.points[i - 1]?.y != null) {
                            lastY = point.y * ( transition / framesPerWeek) + line.points[i - 1].y * ( 1 - transition / framesPerWeek );
                        } else if (point.y != null && line.points[i - 1]?.y === null) {
                            lastX = null;
                        }
                    }
                }

                if (lastX != null && lastY < offsetHeight * 2 + graphHeight)
                {
                    artistLabels.push({
                        color: line.color,
                        name: line.name,
                        x: lastX + WIDTH / 100,
                        y: lastY
                    })
                    weekPoints.push({
                        color: line.color,
                        x: lastX,
                        y: lastY
                    })
                }

                ctx.stroke();
            }
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            ctx.rect(offsetWidth, offsetHeight, graphWidth, graphHeight);
            ctx.clip();

            ctx.beginPath();

            // Point Drawing
            weekPoints.forEach((point) => {
                ctx.fillStyle = point.color;
                ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
            })

            // Artists Drawing
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            
            const orderedArtistLabels = [
                ...artistLabels.filter(label => label.x !== WIDTH / 2),
                ...artistLabels.filter(label => label.x >= WIDTH / 2 - EPSILON),
            ]
            orderedArtistLabels.forEach(label => {
                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                const textMetrics = ctx.measureText(label.name);
                const textWidth = textMetrics.width;
                const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
                ctx.fillRect(
                    label.x - textPadding,
                    label.y - textMetrics.actualBoundingBoxAscent - textPadding,
                    textWidth + textPadding * 2,
                    textHeight + textPadding * 2
                );
                ctx.fillStyle = label.color;
                ctx.fillText(
                    label.name,
                    label.x,
                    label.y
                );
            });

            ctx.restore();

            //foreground (axes labels and ticks)
            ctx.fillStyle = "#FFAAAA";
            ctx.strokeStyle = "#FFAAAA";
            ctx.strokeRect(offsetWidth, offsetHeight, graphWidth, graphHeight);
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            for(let i = 1; i < positions + 1; i++) {
                const y = offsetHeight + ((i - .5) / positions) * graphHeight
                ctx.moveTo(
                    offsetWidth,
                    y
                );
                ctx.lineTo(
                    offsetWidth * 9 / 10,
                    y
                );
                ctx.fillText(
                    i,
                    offsetWidth * 9 / 10,
                    y
                );
            }
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            for(let i = count - 4; i < count + 4; i++) {
                const x = (i - count + 1 - transition / framesPerWeek) * offsetWidth + WIDTH/2;
                if (i - 2 < 0 || i - 2 > totalWeeks - 1) {
                    continue;
                }
                if (x < offsetWidth || x > offsetWidth + graphWidth) {
                    continue;
                }
                ctx.moveTo(
                    x,
                    offsetHeight
                );
                ctx.lineTo(
                    x,
                    offsetHeight * 9 / 10
                );
                ctx.fillText(
                    dayLabels[i - 2],
                    x,
                    offsetHeight * 9 / 10
                );
            }
            ctx.stroke();
        }

        // Creates Video
        const encoder = new VideoEncoder({
            output(chunk, metadata) {
                muxer.addVideoChunk(chunk, metadata);
            },
            error(error) {
                console.error(error);
            }
        });
        encoder.configure({
            codec: "vp8",
            width: canvas.width,
            height: canvas.height,
            bitrate: 5_000_000,
            framerate: framerate
        })

        const totalFrames = (tailendLength * 2 + totalWeeks - 2) * framesPerWeek;
        document.getElementById("render-video").hidden = true;
        canvasContainer.hidden = false;
        for (let frame = 0; frame < totalFrames; frame++) {
            while (encoder.encodeQueueSize > 5) { // buffer
                await new Promise(resolve => setTimeout(resolve, 1));
            }

            drawFrame(frame);

            const videoFrame = new VideoFrame(canvas, {
                timestamp: frame * (1_000_000 / framerate)
            });

            encoder.encode(videoFrame, {
                keyFrame: frame % (framerate * 5) === 0
            });

            videoFrame.close();

            if (Math.floor((frame - 1) / totalFrames * 100) != Math.floor(frame / totalFrames * 100)) {
                showPositionChartProgress(frame / totalFrames)
            }
        }
        
        await encoder.flush();
        
        muxer.finalize();

        const blob = new Blob(
            [target.buffer],
            {type: "video/webm"}
        );

        const localVideoUrl  = URL.createObjectURL(blob);
        currentVideoUrl = localVideoUrl;
        showPositionChartVideo(localVideoUrl);
    }

    document.getElementById("render-video").addEventListener("click", async () => {
        if (!store.user) {
            alert("Please log in first");
            return;
        }
        document.getElementById("render-video").disabled = true;
        
        await renderVideo();

    });
}

function showPositionChartProgress(progress) {
    const percentage = (progress * 100).toFixed(0)
    document.getElementById("video-progress-bar")
        .style.width = `${percentage}%`
    document.getElementById("video-status-percent")
        .textContent = `${percentage}%`
}

function showPositionChartVideo(videoFile) {
    const video = document.getElementById("animated-video");
    video.hidden = false;
    document.getElementById("canvas-container").hidden = true;
    video.src = videoFile;
}