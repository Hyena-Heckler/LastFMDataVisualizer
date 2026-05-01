import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { getAllTracksData, getStoredData, getUpdateStatus} from "./services/tracks.service.js";
import { transformTracks } from "./services/tracks.transform.js";
import { renderVideo, getStatus } from "./integrations/python/client.js"
import path from "path";
import fs from "fs";


dotenv.config();
const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://last-fm-data-visualizer.vercel.app",
  "https://yourtop30.vercel.app"
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // mobile apps / curl

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// handle preflight requests
app.options(/.*/, cors());


app.use(express.json());
app.use("/videos", express.static(path.join(process.cwd(), "../backend-python/assets/videos")));

const PORT = process.env.PORT;


app.post("/update", async (req, res) => {
  try {
    const user = req.body.user;
    const jobId = Date.now().toString();
    const data = await getAllTracksData(
      user,
      process.env.LASTFM_API_KEY,
      jobId
    );
    console.log("Finished updating tracks");

    res.json({
      jobId,
      status: "started"
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});


app.get("/update-status/:jobId", async (req, res) => {
  try {
    const result = await getUpdateStatus(req.params.jobId);
    console.log(result);
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: "status check failed" })
  }
})


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

app.get("/video-status/:jobId", async (req, res) => {
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
    "temp",
    "videos",
    `${req.params.jobId}.mp4`
  );
  const videoDonePath = path.join(
    process.cwd(),
    "..",
    "backend-python",
    "temp",
    "videos",
    `${req.params.jobId}.done`
  );

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: "Video not ready" });
  }


  res.download(videoPath, (err) => {
    if (err) {
      console.error("Download error:", err);
      return;
    }

    // ✅ Delete AFTER successful send
    fs.unlink(videoPath, (unlinkErr) => {
      if (unlinkErr) {
        console.error("Error deleting file:", unlinkErr);
      } else {
        console.log("File deleted:", videoPath);
      }
    });
    fs.unlink(videoDonePath, (unlinkErr) => {
      if (unlinkErr) {
        console.error("Error deleting file:", unlinkErr);
      } else {
        console.log("File deleted:", videoDonePath);
      }
    });
  });
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


