export class Week {
    constructor(startUnix){
        this.startUnix = startUnix; //beginning of the week

        this.trackCounts = new Map(); //gets count of tracks for each week
    }

    addTrack(track) {
        if (!track.name || !track.artist?.["#text"]) return;
        const key = `${track.name}||${track.artist["#text"]}`;
        this.trackCounts.set(key, (this.trackCounts.get(key) || 0) + 1);
    }

    toJSON() {
        return {
        weekStart: this.startUnix,
        tracks:  [...this.trackCounts.entries()].map(([key, count]) => {
                const [name, artist] = key.split("||");
                return { name, artist, count };
            })
        };
    }
}   

