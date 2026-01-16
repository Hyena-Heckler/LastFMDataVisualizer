import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { getAllTracksData } from "./tracks.service.js";
import { transformTracks } from "./tracks.transform.js";
import { spawn } from "child_process";


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://127.0.0.1:8080"
}));
const PORT = 3000;



function runPython(scriptPath, inputData) {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", ["-u", scriptPath], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    py.stdout.setEncoding("utf8");
    py.stderr.setEncoding("utf8");

    py.stdout.on("data", data => {
      stdout += data;
    });

    py.stderr.on("data", data => {
      stderr += data;
    });

    py.stdin.on("error", err => {
      reject(new Error(`stdin error: ${err.message}`));
    });

    py.on("close", code => {
      if (code !== 0) {
        return reject(new Error(`Python exited ${code}:\n${stderr}`));
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(
          `Invalid JSON from Python\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`
        ));
      }
    });

    try {
      py.stdin.write(JSON.stringify(inputData));
      py.stdin.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function renderWorkflow(userData) {
  try {
    const prepData = await runPython("python/prep_data.py", userData);
    // const videoData = await runPython("python/render_video.py", prepData);
    return prepData;
  } catch (err) {
    console.error("Workflow error:", err);
    throw err;
  }
}

app.get("/api/tracks", async (req, res) => {
  try {
    const data = await getAllTracksData(process.env.LASTFM_API_KEY);
    const organizedData = transformTracks(data);
    const organizedDataJson = [...organizedData.entries()].map(([, week]) => (week));
    console.log("Work on Rendering Tracks");
    const response = await renderWorkflow(organizedDataJson)

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
