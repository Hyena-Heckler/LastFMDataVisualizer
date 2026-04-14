import {store} from "./store.js";

let backend_server = "http://localhost:3000"

function downloadJSON(data, filename) { // downloads a JSON file using a data
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

export function setupButtons() {
  document.getElementById("download-json").addEventListener("click", async () => {
    
    if (!store.user) {
      alert("Please log in first");
      return;
    }
    
    const res = await fetch(`${backend_server}/download-json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({user: store.user})
    });
    const data = await res.json();
    downloadJSON(data, "Data");

    console.log("Successful download for:", store.user);
  });

  document.getElementById("update").addEventListener("click", async () => {
    if (!store.user) {
      alert("Please log in first");
      return;
    }

    const res = await fetch(`${backend_server}/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({user: store.user})
    });

    const data = await res.json(); // will follow the same logic in download-video
    console.log("Successful update for:", store.user);
  });

  document.getElementById("download-video").addEventListener("click", async () => {
    if (!store.user) {
      alert("Please log in first");
      return;
    }

    try{
      // Step 1: Creates a job ID to track the progress of video rendering
      const startRes = await fetch(`${backend_server}/start-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({user: store.user})
      })

      const { jobId } = await startRes.json(); // Download video takes a long time, so there is an issue of it timing out. This allows it to run in the background.
      console.log("Job started:", jobId);
      
      // Step 2: Does not let the code proceed until a signal file is found indictating completion/
      let ready = false;

      while (!ready) {
        const statusRes = await fetch(`${backend_server}/status/${jobId}`);
        const statusData = await statusRes.json();

        ready = statusData.ready;

        console.log("Checking status...", ready);

        if (!ready) {
          await new Promise(r => setTimeout(r, 5000)); // wait 2s
        }
      }
      
      // Step 3: Downloads the video as a mp4 file
      console.log("Video ready!");
      const downloadRes = await fetch(`${backend_server}/download-video/${jobId}`);
      const blob = await downloadRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "video.mp4";
      a.click();
      console.log("Successful download video for:", store.user);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Something went wrong");
    }
  });
}