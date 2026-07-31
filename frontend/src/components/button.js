import {store} from "../store.js";
import {updateUser, fetchCache} from "../services/api.js";
import {showPositionChartProgress, showPositionChartVideo} from "./animated-chart.js";


let backend_server =  import.meta.env.VITE_API_URL

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
    
    if (store.cache == null)
    {
      await fetchCache();
    }
    downloadJSON(store.cache, "Data");

    console.log("Successful download for:", store.user);
  });

  document.getElementById("update").addEventListener("click", async () => {
    if (!store.user) {
      alert("Please log in first");
      return;
    }

    // Step 1: Start the updating process
    document.getElementById("update").disabled = true;
    await updateUser();
    await fetchCache();
    document.getElementById("update").disabled = false;
    console.log("Successful update for:", store.user);
  });

  document.getElementById("download-video").addEventListener("click", async () => {
    if (!store.user) {
      alert("Please log in first");
      return;
    }

    try{
      document.getElementById("download-video").disabled = true;
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
        const statusRes = await fetch(`${backend_server}/video-status/${jobId}`);
        const statusData = await statusRes.json();
        ready = statusData.ready;

        console.log("Checking status...", statusData.progress ?? 0);
        showPositionChartProgress(statusData.progress ?? 0);

        if (!ready) {
          await new Promise(r => setTimeout(r, 5000)); // wait 5s
        }
      }
      
      // Step 3: Downloads the video as a mp4 file
      console.log("Video ready!");
      const downloadRes = await fetch(`${backend_server}/download-video/${jobId}`);
      const { url } = await downloadRes.json();
      
      const videoRes = await fetch(url);
      const videoBlob = await videoRes.blob();

      const localVideoUrl = URL.createObjectURL(videoBlob)

      showPositionChartVideo(localVideoUrl);

      console.log("Successful download video for:", store.user);

      // Step 4: Deletes the video from the video storage
      await fetch(`${backend_server}/delete-video/${jobId}`);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Something went wrong");
    }
  });
}
