import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { getAllTracksData, getStoredData} from "./tracks.service.js";
import { transformTracks } from "./tracks.transform.js";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";


dotenv.config();
const app = express();
app.use(express.json());
app.use("/videos", express.static(path.join(process.cwd(), "python/videos")));
app.use(cors({
  origin: "http://127.0.0.1:8080"
}));
const PORT = 3000;



function runPython(scriptPath, inputData, commandPrompt) {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", ["-u", scriptPath], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";


    py.stdout.on("data", data => {
      console.log("PY:", data.toString());
      stdout += data;
    });

    py.stderr.on("data", (data) => {
      console.error("PY ERR:", data.toString());
      stderr += data;
    });

    py.stdin.setDefaultEncoding("utf8");

    py.stdin.on("error", err => {
      reject(new Error(`stdin error: ${err.message}`));
    });

    py.on("error", (err) => {
       reject(new Error(`Failed to spawn python: ${err.message}`));
    });

    py.on("close", code => {
      if (code !== 0) {
        reject(new Error(`Python exited ${code}:\n${stderr}`));
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
      py.stdin.write(JSON.stringify({
        command: commandPrompt,
        payload: inputData
      }));
      py.stdin.end();
    } catch (e) {
      reject(e);
    }
  });
}

function runPythonJob(scriptPath, inputData, commandPrompt, jobId) { // runs python in background and gives jobID number to keep track of
  const py = spawn("python3", ["-u", scriptPath], {
    stdio: ["pipe", "pipe", "pipe"]
  });

  py.stdout.on("data", (data) => {
    console.log("PY:", data.toString());
  });

  py.stderr.on("data", (data) => {
    console.error("PY ERR:", data.toString());
  });

  py.on("close", (code) => {
    console.log(`Job ${jobId} finished with code ${code}`);
  });

  py.stdin.write(JSON.stringify({
    command: commandPrompt,
    payload: inputData,
    jobId
  }));

  py.stdin.end();
}

async function renderWorkflow(userData, promptData) { // could be removed and go direction to run python
  try {
    const prepData = await runPython("python/prep_data.py", userData, promptData);
    return prepData;
  } catch (err) {
    console.error("Workflow error:", err);
    throw err;
  }
}

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
    const workingData = await renderWorkflow(organizedDataJson, "prepare_cached_data");
    runPythonJob("python/prep_data.py", workingData, "get_video", jobId);
    console.log("Start rendering");
    res.json({jobId})
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start video tracks" });
  }
});

app.get("/status/:jobId", (req, res) => {
  const videoPath = path.join(
    process.cwd(),
    "python",
    "videos",
    `${req.params.jobId}.done` // marker file to notify when it is done
  );

  res.json({
    ready: fs.existsSync(videoPath)
  });
});

app.get("/download-video/:jobId", (req, res) => {
  const videoPath = path.join(
    process.cwd(),
    "python",
    "videos",
    `${req.params.jobId}.mp4`
  );

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: "Video not ready" });
  }

  res.download(videoPath);
});




app.post("/top-of-the-week", async (req, res) => {
  try {
    const data = await getStoredData("hyenaheckler");
    const organizedData = transformTracks(data);
    const organizedDataJson = [...organizedData.entries()].map(([, week]) => (week));
    console.log("Work on Organizing Tracks");
    const response = await renderWorkflow(organizedDataJson, "prepare_cached_data")

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});


app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});


