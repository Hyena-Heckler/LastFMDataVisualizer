import dotenv from "dotenv";
import fetch from "node-fetch";
import { Pool } from "pg";
import { getAlbumColor } from "../integrations/python/client.js";
import pkg from "pg-copy-streams";
import { PassThrough } from "stream";

const copyFrom = pkg.from;
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

async function saveUserData(lastfmUsername, data) {
  if (data.length === 0) {
    console.log("No new data to insert");
    return;
  }

  const conn = await db.connect();

  const artistsMap = new Map();
  const albumsMap = new Map();
  const songsMap = new Map();
  const scrobbles = [];

  try {
    await conn.query("BEGIN");

    // -----------------------------
    // 1. BUILD MEMORY STRUCTURES
    // -----------------------------
    for (const s of data) {
      const normalize = (s) => (s || "").trim().toLowerCase();
      const artistKey = `${normalize(s.artist['#text'])}|${s.artist.mbid || ''}`;

      if (!artistsMap.has(artistKey)) {
        artistsMap.set(artistKey, {
          name: s.artist['#text'],
          mbid: s.artist.mbid || null
        });
      }

      const albumKey = `${artistKey}|${s.album['#text']}`;

      if (!albumsMap.has(albumKey)) {
        albumsMap.set(albumKey, {
          name: s.album['#text'],
          mbid: s.album.mbid || null,
          image_url: s?.image?.[0]?.['#text'] || null,
          artistKey
        });
      }

      const songKey = `${albumKey}|${s.name}`;

      if (!songsMap.has(songKey)) {
        songsMap.set(songKey, {
          name: s.name,
          mbid: s.mbid || null,
          url: s.url,
          albumKey
        });
      }

      scrobbles.push({
        songKey,
        played_at: new Date(s.date.uts * 1000)
      });
    }

    // -----------------------------
    // 2. USER
    // -----------------------------
    const userResult = await conn.query(`
      INSERT INTO users (username)
      VALUES ($1)
      ON CONFLICT (username)
      DO UPDATE SET username = EXCLUDED.username
      RETURNING user_id
    `, [lastfmUsername]);

    const user_id = userResult.rows[0].user_id;

    // -----------------------------
    // 3. ARTISTS
    // -----------------------------
    const artists = Array.from(artistsMap.values());

    const artistPlaceholders = [];
    const artistParams = [];

    artists.forEach((a, i) => {
      artistParams.push(a.name, a.mbid);
      artistPlaceholders.push(`($${i * 2 + 1}, $${i * 2 + 2})`);
    });

    await conn.query(`
      INSERT INTO artists (name, mbid)
      VALUES ${artistPlaceholders.join(",")}
      ON CONFLICT (unique_key) DO NOTHING
    `, artistParams);

    // ALWAYS reselect (this is the fix)
    const artistResult = await conn.query(`
      SELECT artist_id, name, mbid
      FROM artists
    `);

    const normalize = (s) => (s || "").trim().toLowerCase();

    const artistIdMap = new Map();
    for (const row of artistResult.rows) {
      artistIdMap.set(
        `${normalize(row.name)}|${row.mbid || ''}`,
        row.artist_id
      );
    }

    // -----------------------------
    // 4. ALBUMS
    // -----------------------------
    const albums = Array.from(albumsMap.values());

    const albumPlaceholders = [];
    const albumParams = [];

    albums.forEach((a, i) => {
      const artist_id = artistIdMap.get(a.artistKey);

      albumParams.push(a.name, a.mbid, artist_id, a.image_url);
      albumPlaceholders.push(`($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`);
    });

    await conn.query(`
      INSERT INTO albums (name, mbid, artist_id, image_url)
      VALUES ${albumPlaceholders.join(",")}
      ON CONFLICT (artist_id, name) DO NOTHING
    `, albumParams);

    const albumResult = await conn.query(`
      SELECT album_id, name, artist_id FROM albums
    `);

    const albumIdMap = new Map();
    for (const row of albumResult.rows) {
      albumIdMap.set(`${row.artist_id}|${row.name}`, row.album_id);
    }

    // -----------------------------
    // 5. SONGS
    // -----------------------------
    const songs = Array.from(songsMap.values());

    const songPlaceholders = [];
    const songParams = [];

    songs.forEach((s, i) => {
      const album = albumsMap.get(s.albumKey);
      const artist_id = artistIdMap.get(album.artistKey);
      const album_id = albumIdMap.get(`${artist_id}|${album.name}`);

      songParams.push(s.name, s.mbid, s.url, artist_id, album_id);

      songPlaceholders.push(
        `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
      );
    });

    await conn.query(`
      INSERT INTO songs (name, mbid, url, artist_id, album_id)
      VALUES ${songPlaceholders.join(",")}
      ON CONFLICT (artist_id, album_id, name) DO NOTHING
    `, songParams);

    const songResult = await conn.query(`
      SELECT song_id, name, artist_id, album_id FROM songs
    `);



    const songIdMap = new Map();
    for (const row of songResult.rows) {
      songIdMap.set(`${row.artist_id}|${row.album_id}|${row.name}`, row.song_id);
    }

    // -----------------------------
    // 6. SCROBBLES (COPY FROM STDIN)
    // -----------------------------

    const copyStream = conn.query(
      copyFrom(`
        COPY scrobbles (user_id, song_id, played_at)
        FROM STDIN WITH (FORMAT csv)
      `)
    );

    const passthrough = new PassThrough();
    passthrough.pipe(copyStream);

    let total = 0;
    let skipped_no_song = 0;
    let skipped_no_album = 0;
    let skipped_no_artist = 0;
    let skipped_no_song_id = 0;

    for (const s of scrobbles) {
      const song = songsMap.get(s.songKey);

      if (!song) {
        skipped_no_song++;
        continue;
      }

      const album = albumsMap.get(song.albumKey);
      if (!album) {
        skipped_no_album++;
        continue;
      }

      const artist_id = artistIdMap.get(album.artistKey);
      if (!artist_id) {
        skipped_no_artist++;
        continue;
      }

      const album_id = albumIdMap.get(`${artist_id}|${album.name}`);
      const song_id = songIdMap.get(`${artist_id}|${album_id}|${song.name}`);

      if (!song_id) {
        skipped_no_song_id++;
        continue;
      }

      total++;

      passthrough.write(
        `${user_id},${song_id},${s.played_at.toISOString()}\n`
      );
    }

    passthrough.end();

    await new Promise((resolve, reject) => {
      copyStream.on("error", (err) => {
        console.error("❌ COPY ERROR:", err);
        reject(err);
      });

      copyStream.on("finish", () => {
        console.log("COPY finished successfully");
        resolve();
      });
    });

    // -----------------------------
    // 7. COMMIT
    // -----------------------------
    await conn.query("COMMIT");

  } catch (err) {
    await conn.query("ROLLBACK");
    console.error("saveUserData failed:", err);
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
