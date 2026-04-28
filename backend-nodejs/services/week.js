export class Week {
    constructor(startUnix){
        this.startUnix = startUnix; //beginning of the week (Starts on Friday)
        this.trackCounts = new Map(); //gets count of tracks for a song in this week
    }

    addTrack(track) {
        if (!track.name || !track.artist?.["#text"]) return;
        const key = `${track.name}||${track.artist["#text"]}||${track.image[0]["#text"]}||${track.album["#text"]}`;
        this.trackCounts.set(key, (this.trackCounts.get(key) || 0) + 1); // adds 1 to the value of plays or intializes it as 1
    }

    toJSON() {
        return {
        weekStart: this.startUnix,
        tracks:  [...this.trackCounts.entries()].map(([key, count]) => {
                const [name, artist, image, album] = key.split("||");
                return { name, artist, image, album, count };
            })
        };
    }
}   
