import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { getAllTracksData, getStoredData, getUpdateStatus} from "./services/tracks.service.js";
import { transformTracks, weekFriendlyCache } from "./services/tracks.transform.js";
import { renderVideo, getStatus, prepareCached, calculateStatistics} from "./integrations/python/client.js"
import path from "path";
import fs from "fs";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

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


app.use(express.json({
  limit: "10mb"
}));

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
    if (data == null) {
      throw new Error("User Data cannot be received"); 
    }
    console.log("Finished Updating tracks");

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
    console.log("Updating Job Id", result);
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: "status check failed" })
  }
})


app.post("/download-cache", async (req, res) => {
  try {
    const user = req.body.user;
    const data = await getStoredData(user);
    const organizedData = transformTracks(data);
    const organizedDataJson = [...organizedData.entries()].map(([, week]) => (week));
    const arrayChartJson = await prepareCached(organizedDataJson);
    const weeklyChartJson = await weekFriendlyCache(arrayChartJson);
    const userStatistics = await calculateStatistics(arrayChartJson.data);
    console.log("Finished Preparing File for Cache");

    res.json(
      {
        normalCache: arrayChartJson,
        weeklyCache: weeklyChartJson,
        statisticsCache: userStatistics
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cache tracks" });
  }
});

app.post("/start-video", async (req, res) => {
  try {
    const jobId = Date.now().toString();

    const user = req.body.user;

    const data = await getStoredData(user);

    const organizedData = transformTracks(data);

    const organizedDataJson =
      [...organizedData.entries()].map(([, week]) => week);

    renderVideo(
      organizedDataJson,
      jobId
    );

    console.log("Start Rendering");

    res.json({
      jobId,
      status: "started"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to start video tracks"
    });
  }
});

app.get("/video-status/:jobId", async (req, res) => {
  try {
    console.log("Checking...");
    const result = await getStatus(req.params.jobId);
    console.log(result);
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: "status check failed" })
  }
})

app.get("/download-video/:jobId", async (req, res) => {
  try {
    const jobId = req.params.jobId;

    const objectKey = `videos/${jobId}.mp4`;

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: objectKey,
      ResponseContentType: "video/mp4"
    });

    const url = await getSignedUrl(r2, command, {
      expiresIn: 3600,
    });

    console.log(url)

    res.json({ url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate download URL" });
  }
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


