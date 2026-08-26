import {store} from "../store.js";
import {fetchCache, fetchPrepythonCache} from "../services/api.js";

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

  document.getElementById("download-partial-json").addEventListener("click", async () => {
    
    if (!store.user) {
      alert("Please log in first");
      return;
    }
    
    const partialCache = await fetchPrepythonCache();
    downloadJSON(partialCache, "PartialData");

    console.log("Successful partial download for:", store.user);
  });  
}
