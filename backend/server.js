import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { getAllTracksData } from "./tracks.service.js";
import { transformTracks } from "./tracks.transform.js";
import { spawn } from "child_process";

dotenv.config();
const app = express();
app.use(cors({
  origin: "http://127.0.0.1:8080"
}));
const PORT = 3000;

function runPython(scriptPath, inputData) {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", ["scriptPath"]);

    let out = "";
    let err = "";

    py.stdout.on("data", d => out += d);
    py.stderr.on("data", d => err += d);

    py.on("close", code => {
      if (code !== 0) reject(err);
      else resolve(JSON.parse(out));
    });

    py.stdin.write(JSON.stringify(inputData));
    py.stdin.end();
  });
}

async function renderWorkflow(userData) {
  try {
    const prepData = await runPython("python/prep_data.py", userData);
    const videoData = await runPython("python/render_video.py", prepData);
    const finalData = await runPython("python/post_process.py", videoData);
    return finalData;
  } catch (err) {
    console.error("Workflow error:", err);
    throw err;
  }
}

app.get("/api/tracks", async (req, res) => {
  try {
    const data = await getAllTracksData(process.env.LASTFM_API_KEY);
    const organizedData = transformTracks(data)
    const organizedDataJson = [...organizedData.entries()].map(([weekUnix, week]) => (week));
    const response = renderWorkflow(organizedDataJson)

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
