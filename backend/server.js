import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { getAllTracksData } from "./tracks.server.js";
import { transformTracks } from "./tracks.transform.js";

dotenv.config();
const app = express();
app.use(cors({
  origin: "http://127.0.0.1:8080"
}));
const PORT = 3000;

app.get("/api/tracks", async (req, res) => {
  try {
    const data = await getAllTracksData(process.env.LASTFM_API_KEY);
    const organizedData = transformTracks(data)

    const response = [...organizedData.entries()].map(([weekUnix, week]) => ({
      weekStart: weekUnix,
      tracks: week
    }));

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
