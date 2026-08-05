import { Week } from "./week.js";

function previousFriday(unixTime) { // goes back a week in Unix time
    const secondsInDay = 86400;
    const secondsInWeek = 7 * secondsInDay;

    //Time since last Thursday midnight (Unix epoch starts on Thursday, so week is off for any days on Thursday)
    const timeSinceThursday = unixTime % secondsInWeek;
    let timeOffFromFriday;
    if (timeSinceThursday === secondsInDay) {
        // If exactly Friday midnight, there is no need to subtract anything
        timeOffFromFriday = 0;
    }
    else if (timeSinceThursday > secondsInDay) {
        //If after Friday in this week: backtracked to this week's friday
        timeOffFromFriday = timeSinceThursday - secondsInDay;
    } else {
        //If before Friday in this week: backtracked to last week's Friday
        timeOffFromFriday = secondsInWeek - secondsInDay + timeSinceThursday;
    }
    return unixTime - timeOffFromFriday;
}

export function transformTracks(tracks) {
    const userWeeklyListening = new Map();

    tracks.forEach((track) => {
        if (!track.date || !track.date.uts) return;
        const unixFridayOfTheWeek = previousFriday(track.date.uts)

        if(!userWeeklyListening.has(unixFridayOfTheWeek)) {
            userWeeklyListening.set(unixFridayOfTheWeek, new Week(unixFridayOfTheWeek))
        }
        userWeeklyListening.get(unixFridayOfTheWeek).addTrack(track)
    })

    return userWeeklyListening
}

export function weekFriendlyCache(cache) {
    const songs = {};
    const weeks = {};
    const weekNames = cache.data[0].slice(1);

    weekNames.forEach(week => {
        weeks[week] = new Array(30).fill(null);
    })

    cache.data.slice(1).forEach((song, cacheSongId) => {
        songs[cacheSongId] = {
            ...song[0],
            weeks: 0,
            peak: 31,
            firstAppearance: null,
            streak: 0,
            previousPosition: null,
            previousIndex: -1,
            lifetimePoints: 0
        };

        song.slice(1).forEach((songEntry, index) => {
            if (songEntry["position"] != null) {
                const song = songs[cacheSongId];
                song.weeks ++;
                song.lifetimePoints += songEntry.points;
                if (songEntry.position < song.peak) song.peak = songEntry.position;
                
                if (song.firstAppearance == null) song.firstAppearance = weekNames[index];
                
                if (song.previousPosition == songEntry.position) song.streak++;
                else song.streak = 1;
                
                weeks[weekNames[index]][songEntry.position - 1] = {
                    songId: cacheSongId,
                    position: songEntry.position,
                    points: songEntry.points,
                    weeks: song.weeks,
                    previousPosition: song.previousIndex === index - 1 ? song.previousPosition : null,
                    streak: song.streak,
                    peak: song.peak,
                    lifetimePoints: song.lifetimePoints
                }
                song.previousIndex = index;
                song.previousPosition = songEntry.position;
            }
        });
    });
    

    return {
        songs,
        weeks
    };
}


export function normalizeAlbum(albumText) {
    return albumText
        // Remove parenthesized/bracketed editions
        .replace(
            /\s*[\(\[](?=[^\)\]]*(?:deluxe|super deluxe|expanded|special|remastered|anniversary|3am|til dawn))[^\)\]]*[\)\]]/gi,
            ""
        )
        .replace(/\s+deluxe:.*$/i, "")
        .replace(
            /\s+(?:special edition|deluxe edition|expanded edition|deluxe|expanded|remastered)$/i,
            ""
        )

        // Remove versions/remixes
        .replace(/\s*-\s*(?:(?!taylor['’]s version).)*(?:remix|version|acoustic|remastered|cover|spotify singles).*$/i, "")
        .replace(
            /\s*[\(\[](?!(?:[^\)\]]*taylor['’]s version))[^\)\]]*(?:remix|version|ver\.|remastered|sped up|mash[- ]?up|single|acoustic)[^\)\]]*[\)\]]/gi,
            ""
        )
        .replace(/\s*[\(\[]from the vault[\)\]]/gi, "")

        // Remove features
        .replace(/\s*[\(\[](?:feat\.?\s|featuring\s|feat\s).*?[\)\]]/gi, "")
        .replace(/\s+featuring\s+.*/gi, "")
        .replace(/\s+feat\.?\s+.*/gi, "")

        .replace(/\s{2,}/g, " ")
        .trim();
}   

export function normalizeSong(songText) {
    return songText
        // Remove versions/remixes
        .replace(/\s*-\s*(?:(?!taylor['’]s version).)*(?:remix|version|acoustic|remastered|cover|spotify singles).*$/i, "")
        .replace(
            /\s*[\(\[](?!(?:[^\)\]]*taylor['’]s version))[^\)\]]*(?:remix|version|ver\.|remastered|sped up|mash[- ]?up|single|acoustic)[^\)\]]*[\)\]]/gi,
            ""
        )
        .replace(/\s*[\(\[]from the vault[\)\]]/gi, "")

        // Remove features
        .replace(/\s*[\(\[](?:feat\.?\s|featuring\s|feat\s).*?[\)\]]/gi, "")
        .replace(/\s+featuring\s+.*/gi, "")
        .replace(/\s+feat\.?\s+.*/gi, "")

        .replace(/\s{2,}/g, " ")
        .trim();
}