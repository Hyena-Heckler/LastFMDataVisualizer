import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors({
  origin: "http://127.0.0.1:8080"
}));
const PORT = 3000;

/* Use for another file
const from = ["2024", "01", "23"];
const to = ["2024", "01", "30"];

class Track { // creates a track
  constructor(trackName) {
    this.trackName = trackName
  }
}

function dateToUnix(year, month, day) { // turns a standard data to Unix time
  const dateStr = `${year}-${month}-${day}T00:00:00Z`;
  const unixTime = Math.floor(new Date(dateStr).getTime() / 1000);
  return unixTime;
}

function unixToDate(unixTime) { // turns Unix time to a standard date
  const date = new Date(unixTime * 1000);
  return date;
}

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
*/

async function getTotalTrackNumber() { // gets the number of tracks
  const url = `https://ws.audioscrobbler.com/2.0/?user=hyenaheckler&api_key=${process.env.LASTFM_API_KEY}&format=json&method=user.getinfo`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "LastFMAnimatedCharts/0.1 (shettyharsh248@gmail.com)"
    }
  });

  const data = await response.json();
  return data.user.playcount;
}

async function getFirstTrackTime(totalTrackNumber) { // gets the time of the first track
  const url = `https://ws.audioscrobbler.com/2.0/?user=hyenaheckler&api_key=${process.env.LASTFM_API_KEY}&format=json&method=user.getrecenttracks&limit=1&page=${totalTrackNumber}`
  const response = await fetch(url, {
    headers: {
      "User-Agent": "LastFMAnimatedCharts/0.1 (shettyharsh248@gmail.com)"
    }
  });

  const data = await response.json();
  return data.recenttracks.track[data.recenttracks.track.length - 1].date.uts;
}

async function getMaxTracksFromPage(page, limit = 1000) { // gets all tracks from a page
  const url = `https://ws.audioscrobbler.com/2.0/?user=hyenaheckler&api_key=${process.env.LASTFM_API_KEY}&format=json&method=user.getrecenttracks&limit=${limit}&page=${page}`
  console.log("page");
  const response = await fetch(url, {
    headers: {
      "User-Agent": "LastFMAnimatedCharts/0.1 (shettyharsh248@gmail.com)"
    }
  });

  const data = await response.json();
  if (!data.recenttracks || !data.recenttracks.track) {
    console.error("Unexpected response for page", page);
    console.error(data);
    return [];
  }
  return data.recenttracks.track;
}

async function getAllTracksBatch(totalTrackNumber, batchSize = 3) { // gets multiple pages of data in a batch
  const totalPages = Math.ceil(totalTrackNumber / 1000);

  let userPlaylistHistory = [];
  for(let i = 1; i <= totalPages; i += batchSize) {
    const batch = [];

    for(let j = i; j < i + batchSize && j <= totalPages; j++) {
      const limit = j < totalPages ? 1000 : totalTrackNumber % 1000 || 1000;
      batch.push(getMaxTracksFromPage(j, limit));
    }

    const results = await Promise.all(batch);
    userPlaylistHistory = userPlaylistHistory.concat(results.flat());

    await new Promise(r => setTimeout(r, 400));
  }
  return userPlaylistHistory;
}



async function getAllTracksData() { //gets all tracks data including when the first one was
  const totalTracks = await getTotalTrackNumber();
  const firstTrackTime = await getFirstTrackTime(totalTracks);
  console.log(firstTrackTime)
  return getAllTracksBatch(totalTracks);
}

app.get("/api/tracks", async (req, res) => {
  try {
    const data = await getAllTracksData();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
