import { Week } from "./week.js";

function previousFriday(unixTime) { // goes back a week in Unix time
    const secondsInDay = 86400;
    const secondsInWeek = 7 * secondsInDay;

    //Time since last Thursday midnight (Unix epoch starts on Thursday)
    const timeSinceThursday = unixTime % secondsInWeek;
    let timeOffFromFriday;
    if (timeSinceThursday === secondsInDay) {
        // Exactly Friday midnight, no need to subtract anything
        timeOffFromFriday = 0;
    }
    else if (timeSinceThursday > secondsInDay) {
        //After Friday in this week: backtracked to this week's friday
        timeOffFromFriday = timeSinceThursday - secondsInDay;
    } else {
        //Before Friday in this week: backtracked to last week's Friday
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
