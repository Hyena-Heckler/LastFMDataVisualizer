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

async function getUser(lastfmUsername) {
  const [result] = await db.execute(`
    INSERT INTO users (username)
    VALUES (?)
    ON DUPLICATE KEY UPDATE user_id = LAST_INSERT_ID(user_id)
  `, [lastfmUsername]);
  return result.insertId;
}

async function saveUserData(lastfmUsername, data) {
  try {
    const user_id = await getUser(lastfmUsername);
    for (let scrobble_index = 0; scrobble_index < data.length;  scrobble_index++) {
      const scrobble = data[scrobble_index];
      const [artist] = await db.execute(`
        INSERT INTO artists (name, mbid)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE artist_id = LAST_INSERT_ID(artist_id)
      `, [scrobble.artist['#text'], scrobble.artist['mbid'] || null]);

      const [album] = await db.execute(`
        INSERT INTO albums (name, mbid, artist_id, image_url)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE album_id = LAST_INSERT_ID(album_id)
      `, [scrobble.album['#text'], scrobble.album['mbid'] || null, artist.insertId, scrobble?.image[0]?.['#text'] || null]);

      const [song] = await db.execute(`
        INSERT INTO songs (name, mbid, url, artist_id, album_id)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE song_id = LAST_INSERT_ID(song_id)
      `, [scrobble.name, scrobble.mbid || null, scrobble.url, artist.insertId, album.insertId]);
      
      await db.execute(`
        INSERT INTO scrobbles (user_id, song_id, played_at)
        VALUES (?, ?, ?)
      `, [user_id, song.insertId, new Date(scrobble.date['uts'] * 1000)]);
    }
  } catch (err) {
    console.error("saveUserData crashed:", err);
  }
}

async function loadUser(lastfmUsername) {
  const [rows] = await db.execute(
    `SELECT user_id FROM users WHERE username = ?`,
    [lastfmUsername]
  );

  return rows[0]?.user_id || null;
}

async function formatScrobbleData(scrobbleData) {
  return scrobbleData.map(row => ({
    artist: {
      mbid: row.artist_mbid,
      '#text': row.artist_name
    },

    image: [
      { '#text': row.image_url, size: 'small' },
      { '#text': row.image_url, size: 'medium' },
      { '#text': row.image_url, size: 'large' }
    ],

    mbid: row.song_mbid,

    album: {
      mbid: row.album_mbid,
      '#text': row.album_name
    },

    name: row.song_name,
    url: row.song_url,

    date: {
      uts: Math.floor(new Date(row.played_at).getTime() / 1000).toString(),
      '#text': new Date(row.played_at).toLocaleString()
    }
  }));
}

async function loadUserData(lastfmUsername) {
  try {
    const user_id = await loadUser(lastfmUsername);
    if(!user_id) {
      return null
    }
    console.log(user_id)
    const [rows] = await db.execute(`
      SELECT 
        s.played_at,
        so.name AS song_name,
        so.mbid AS song_mbid,
        so.url AS song_url,
        ar.name AS artist_name,
        ar.mbid AS artist_mbid,
        al.name AS album_name,
        al.mbid AS album_mbid,
        al.image_url
      FROM scrobbles s
      JOIN songs so ON s.song_id = so.song_id
      JOIN artists ar ON so.artist_id = ar.artist_id
      JOIN albums al ON so.album_id = al.album_id
      WHERE s.user_id = ?
      ORDER BY s.played_at DESC
    `, [user_id]);
    console.log("formatting left")
    return formatScrobbleData(rows);
  } catch (err) {
    console.error("loadUserData crashed:", err);
  }
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
    loggedTracks = userData.length;
    userJSON = userData;
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

    if (!data.recenttracks || !data.recenttracks.track) {
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
  await saveUserData(username, newData);
  return data;
}

export async function getStoredData(username) {
  const userData = await loadUserData(username);
  if (userData) {
    return userData;
  } else {
    return null;
  }
}
