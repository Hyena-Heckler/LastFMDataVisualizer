import fetch from "node-fetch";

export async function getAllTracksData(apiKey) { //gets all tracks data including when the first one was
  const totalTracks = await getTotalTrackNumber();

  async function getTotalTrackNumber() { // gets the number of tracks
    const url = `https://ws.audioscrobbler.com/2.0/?user=hyenaheckler&api_key=${apiKey}&format=json&method=user.getinfo`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "LastFMAnimatedCharts/0.1 (shettyharsh248@gmail.com)"
      }
    });

    const data = await response.json();
    return Number(data.user.playcount);
  }

  async function getMaxTracksFromPage(page, limit = 1000) { // gets all tracks from a page
    const url = `https://ws.audioscrobbler.com/2.0/?user=hyenaheckler&api_key=${apiKey}&format=json&method=user.getrecenttracks&limit=${limit}&page=${page}`
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

  return getAllTracksBatch(totalTracks);
}
