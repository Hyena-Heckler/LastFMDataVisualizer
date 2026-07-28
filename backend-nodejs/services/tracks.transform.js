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
                    previousPosition: song.previousPosition,
                    streak: song.streak,
                    peak: song.peak,
                    lifetimePoints: song.lifetimePoints
                }

                song.previousPosition = songEntry.position;
            }
        });
    })
    

    return {
        songs,
        weeks
    };
}

// {
//   "songs": {
//     "0": {
//       "name": "Locals",
//       "artist": "underscores",
//       "color": [...]
//     }
//   },
//   "weeks": {
//     "11/10/23": [
//       {
//         "songId": 0,
//         "position": 1,
//         "change": null
//       }
//     ],
//     "11/17/23": [
//       {
//         "songId": 0,
//         "position": 3,
//         "change": -2
//       }
//     ]
//   }
// }