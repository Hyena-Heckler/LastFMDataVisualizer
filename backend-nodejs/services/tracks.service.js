import dotenv from "dotenv";
import fetch from "node-fetch";
import { Pool } from "pg";
import { getAlbumColor } from "../integrations/python/client.js"

dotenv.config();

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function getUser(lastfmUsername) {
  const result = await db.query(`
    INSERT INTO users (username)
    VALUES ($1)
    ON CONFLICT (username)
    DO UPDATE SET username = EXCLUDED.username
    RETURNING user_id;
  `, [lastfmUsername]);

  return result.rows[0]?.user_id;
}

export async function updateJob(jobId, update) {
  await db.query(`
    INSERT INTO jobs (job_id, status, step, progress)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (job_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      step = EXCLUDED.step,
      progress = EXCLUDED.progress
  `, [
    jobId,
    update.status,
    update.step,
    update.progress
  ]);
}



async function updateColorOfAlbums(){
  const result = await db.query(`
    SELECT album_id, image_url
    FROM albums
    WHERE color_r IS NULL
      OR color_g IS NULL
      OR color_b IS NULL
  `);

  const rows = result.rows

  console.log("Row Length:", rows.length)

  async function updateColors(initial, limit = 500) { 
    console.log(initial, " | ", initial + limit);
    const results = await getAlbumColor(rows.slice(initial, initial + limit));
    const albums = results.data
    const ids = albums.map(r => r.album_id);

    if (!ids.length) return;

    const rCase = albums.map(r => `WHEN ${r.album_id} THEN ${r.color[0]}`).join(" ");
    const gCase = albums.map(r => `WHEN ${r.album_id} THEN ${r.color[1]}`).join(" ");
    const bCase = albums.map(r => `WHEN ${r.album_id} THEN ${r.color[2]}`).join(" ");

    await db.query(`
      UPDATE albums
      SET
        color_r = CASE album_id ${rCase} END,
        color_g = CASE album_id ${gCase} END,
        color_b = CASE album_id ${bCase} END
      WHERE album_id = ANY($1::int[])
    `, [ids]);
  }


  async function updateColorBatches(totalAlbums, batchSize = 5) {
    const totalBatches = Math.ceil(totalAlbums / 500);

    for(let i = 0; i < totalBatches; i += batchSize) {
      const batch = [];
      console.error("New Batch");
      for(let j = i; j < i + batchSize && j <= totalBatches; j++) {
        const limit = j < totalBatches ? 500 : totalAlbums % 500 || 500;
        batch.push(updateColors(j * 500, limit));
      }

      await Promise.all(batch);

      await new Promise(r => setTimeout(r, 500));
    }
  }

  await updateColorBatches(rows.length)
}

async function saveUserData(lastfmUsername, data, onProgress) {
  const conn = await db.connect();

  console.log("Begin");
  await conn.query("BEGIN");
  try {

    const userResult = await conn.query(`
      INSERT INTO users (username)
      VALUES ($1)
      ON CONFLICT (username)
      DO UPDATE SET username = EXCLUDED.username
      RETURNING user_id
    `, [lastfmUsername]);

    const user_id = userResult.rows[0].user_id;

    for (let i = 0; i < data.length; i++) {
      if (i % 100 === 0) {
        console.log("Inserted:", i);
      }
      const scrobble = data[i];

      let artistResult;
      try {
        artistResult = await conn.query(`
          INSERT INTO artists (name, mbid)
          VALUES ($1, $2)
          ON CONFLICT (unique_key)
          DO UPDATE SET name = EXCLUDED.name
          RETURNING artist_id
        `, [scrobble.artist['#text'], scrobble.artist['mbid'] || null]);
      } catch (e) {
        console.error("SCROBBLE FAILED:", e);
        throw e;
      }

      const artist_id = artistResult.rows[0].artist_id;

      const albumResult = await conn.query(`
        INSERT INTO albums (name, mbid, artist_id, image_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (artist_id, name)
        DO UPDATE SET album_id = albums.album_id
        RETURNING album_id
      `, [
        scrobble.album['#text'],
        scrobble.album['mbid'] || null,
        artist_id,
        scrobble?.image?.[0]?.['#text'] || null
      ]);

      const album_id = albumResult.rows[0].album_id;

      const songResult = await conn.query(`
        INSERT INTO songs (name, mbid, url, artist_id, album_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (artist_id, album_id, name)
        DO UPDATE SET song_id = songs.song_id
        RETURNING song_id
      `, [
        scrobble.name,
        scrobble.mbid || null,
        scrobble.url,
        artist_id,
        album_id
      ]);

      const song_id = songResult.rows[0].song_id;

      await conn.query(`
        INSERT INTO scrobbles (user_id, song_id, played_at)
        VALUES ($1, $2, $3)
      `, [
        user_id,
        song_id,
        new Date(scrobble.date['uts'] * 1000)
      ]);

      if (onProgress) {
        onProgress({
          stage: "db_write",
          current: i + 1,
          total: data.length,
          percent: Math.floor(((i + 1) / data.length) * 100)
        });
      }

      if ((i + 1) % 500 === 0) {
        await conn.query("COMMIT");
        await conn.query("BEGIN");
      }
    }
    await conn.query("COMMIT");

    if (onProgress) {
      onProgress({
        stage: "db_write",
        current: data.length,
        total: data.length,
        percent: 100
      });
    }

  } catch (err) {
    await conn.query("ROLLBACK");
    console.error("saveUserData crashed:", err);
    throw err;
  } finally {
    conn.release();
  }
}

async function loadUser(lastfmUsername) {
  const result = await db.query(
    `SELECT user_id FROM users WHERE username = $1`,
    [lastfmUsername]
  );

  return result.rows[0]?.user_id || null;
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
    color_r: row.album_color_r,
    color_g: row.album_color_g,
    color_b: row.album_color_b,

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
    const result = await db.query(`
      SELECT 
        s.played_at,
        so.name AS song_name,
        so.mbid AS song_mbid,
        so.url AS song_url,
        ar.name AS artist_name,
        ar.mbid AS artist_mbid,
        al.name AS album_name,
        al.mbid AS album_mbid,
        al.image_url,
        al.color_r as album_color_r,
        al.color_g as album_color_g,
        al.color_b as album_color_b
      FROM scrobbles s
      JOIN songs so ON s.song_id = so.song_id
      JOIN artists ar ON so.artist_id = ar.artist_id
      JOIN albums al ON so.album_id = al.album_id
      WHERE s.user_id = $1
      ORDER BY s.played_at DESC
    `, [user_id]);

    console.log("formatting left")
    return formatScrobbleData(result.rows);
  } catch (err) {
    console.error("loadUserData crashed:", err);
  }
}


export async function getAllTracksData(username, apiKey, jobId) {
  await updateJob(jobId, {
    status: "processing",
    step: "fetching",
    progress: 5
  });


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

  
  let totalTracks = 0;
  try {
    totalTracks = await getTotalTrackNumber();
  } catch (err) {
    console.log(err)
    return null;
  }

  const userData = await loadUserData(username);
  let loggedTracks = 0;
  let userJSON = [];
  if (userData) {
    loggedTracks = userData.length;
    userJSON = userData;
  }

  await updateJob(jobId, {
    status: "processing",
    step: "db_write",
    progress: 10
  });

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
  console.log("Saving tracks:", newData);
  await saveUserData(username, newData, (progress) => {
    updateJob(jobId, {
      status: "processing",
      step: progress.stage,
      progress: progress.percent
    });
  });
  
  console.log("Colors In");
  await updateColorOfAlbums();
  console.log("Colors Out");

  await updateJob(jobId, {
    status: "completed",
    step: "done",
    progress: 100
  });
  return data;
}
export async function getUpdateStatus(jobId) {
  const result = await db.query(`
    SELECT 
      j.status AS status,
      j.step AS step,
      j.progress AS progress
    FROM jobs j
    WHERE j.job_id = $1
  `, [jobId]);

  const row = result.rows;

  console.log(row);
  if (!row.length) {
    return { ready: false, progress: 0 }
  }

  if (row[0].status === "completed" || row[0].step === "done" || row[0].progress === 100) {
    return {ready: true, progress: 100}
  } else {
    return {ready: false, progress: row[0].progress}
  }
}

export async function getStoredData(username) {
  const userData = await loadUserData(username);
  
  if (userData) {
    return userData;
  } else {
    return null;
  }
}
