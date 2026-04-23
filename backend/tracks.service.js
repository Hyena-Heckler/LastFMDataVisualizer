import dotenv from "dotenv";
import fetch from "node-fetch";
import mysql from "mysql2/promise";

dotenv.config();

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "user_info",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function saveUserData(lastfmUsername, data) {
  await db.execute(
    `
    INSERT INTO users (lastfm_username, data)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE data = VALUES(data)
    `,
    [lastfmUsername, JSON.stringify(data)]
  );
}

async function loadUserData(lastfmUsername) {
  const [rows] = await db.execute(
    `SELECT data FROM users WHERE lastfm_username = ?`,
    [lastfmUsername]
  );

  return rows[0]?.data || null;
}


export async function getAllTracksData(username, apiKey) {

  let totalTracks = 0;
  try {
    totalTracks = await getTotalTrackNumber();
  } catch (err) {
    console.log(err)
    return null;
  }

  async function getTotalTrackNumber() { 
    // gets the number of tracks
    const url = `https://ws.audioscrobbler.com/2.0/?user=${username}&api_key=${apiKey}&format=json&method=user.getinfo`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "LastFMAnimatedCharts/0.1 (shettyharsh248@gmail.com)"
      }
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.message);
    }

    return Number(data.user.playcount)
  }

  const userData = await loadUserData(username);
  let loggedTracks = 0;
  let userJSON = [];
  if (userData) {
    loggedTracks = JSON.parse(userData).length;
    userJSON = JSON.parse(userData);
  }

  async function getMaxTracksFromPage(page, limit = 1000, filterCurrentlyPlaying = true) { 
    const url = `https://ws.audioscrobbler.com/2.0/?user=${username}&api_key=${apiKey}&format=json&method=user.getrecenttracks&limit=${limit}&page=${page}`
    console.log(`page ${page}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "LastFMAnimatedCharts/0.1 (shettyharsh248@gmail.com)"
      }
    });

    const data = await response.json();

    if (!data.recenttracks || !data.recenttracks.track || Math.random() < .2) {
      console.error("Unexpected response for page", page);
      console.error(data);
      return getMaxTracksFromPage(page, limit, filterCurrentlyPlaying); // redoes the damaged page *ASSUMES error was due to too many requests
    }
    if (filterCurrentlyPlaying === true) {
      return data.recenttracks.track.filter(singleTrack => !singleTrack['@attr'] || !singleTrack['@attr'].nowplaying === true);
    } else {
      return data.recenttracks.track
    }
  }

  async function getAllTracksBatch(totalTrackNumber, batchSize = 5) { // gets multiple pages of data in a batch
    const totalPages = Math.ceil(totalTrackNumber / 1000);

    let userPlaylistHistory = [];
    for(let i = 1; i <= totalPages; i += batchSize) {
      const batch = []; // allows pages to be done in batches so it is processed faster, but not overwhelm lastfm api
      console.error("New Batch");
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
  
  const firstSinglePage = await getMaxTracksFromPage(1, 1, false);
  if(firstSinglePage.length === 2) totalTracks--; // if a song is currently playing, the array will be one greater than the actual size, this takes that in consideration
  console.log("Total Tracks: ", totalTracks);
  console.log("Logged Tracks: ", loggedTracks);

  let newData = await getAllTracksBatch(totalTracks - loggedTracks);
  console.log("New Data Type: ", typeof newData);
  console.log("Logged Data Type: ", typeof userJSON);
  let data = newData.concat(userJSON);
  console.log("Saving tracks:", data.length);
  await saveUserData(username, data);
  return data;
}

export async function getStoredData(username) {
  const userData = await loadUserData(username);
  if (userData) {
    return JSON.parse(userData);
  } else {
    return null;
  }
}
