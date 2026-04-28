import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { getAllTracksData, getStoredData} from "./services/tracks.service.js";
import { transformTracks } from "./services/tracks.transform.js";
import { renderVideo, getStatus } from "./integrations/python/client.js"
import path from "path";
import fs from "fs";


dotenv.config();
const app = express();
app.use(express.json());
app.use("/videos", express.static(path.join(process.cwd(), "../backend-python/assets/videos")));
app.use(cors({
  origin: "http://127.0.0.1:8080"
}));
const PORT = 3000;


app.post("/update", async (req, res) => {
  try {
    const user = req.body.user;
    const data = await getAllTracksData(user, process.env.LASTFM_API_KEY);
    console.log("Finished updating tracks");

    res.json({
      success: true,
      message: "Updated"
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});


app.post("/download-json", async (req, res) => {
  try {
    const user = req.body.user;
    const data = await getStoredData(user);
    const organizedData = transformTracks(data);
    const organizedDataJson = [...organizedData.entries()].map(([, week]) => (week));
    console.log("Finished preparing file for download");

    res.json(organizedDataJson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to download tracks" });
  }
});

app.post("/start-video", async (req, res) => {
  try {
    const jobId = Date.now().toString();

    const user = req.body.user;
    const data = await getStoredData(user);
    const organizedData = transformTracks(data);
    const organizedDataJson = [...organizedData.entries()].map(([, week]) => (week));
    renderVideo(organizedDataJson, jobId)
    console.log("Start rendering");
    res.json({
      jobId,
      status: "started"
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start video tracks" });
  }
});

app.get("/status/:jobId", async (req, res) => {
  try {
    const result = await getStatus(req.params.jobId);
    console.log(result);
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: "status check failed" })
  }
})

app.get("/download-video/:jobId", async (req, res) => {
  const videoPath = path.join(
    process.cwd(),
    "..",
    "backend-python",
    "app",
    "assets",
    "videos",
    `${req.params.jobId}.mp4`
  );
  console.log(videoPath)

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: "Video not ready" });
  }

  res.download(videoPath);
});




app.post("/top-of-the-week", async (req, res) => {
  try {
    
    res.json("WORK IN PROGRESS");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});


app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});


