import {store} from "./store.js";

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
  document.getElementById("download").addEventListener("click", async () => {
    
    if (!store.user) {
      alert("Please log in first");
      return;
    }
    
    const res = await fetch("http://localhost:3000/download", {
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

    const res = await fetch("http://localhost:3000/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({user: store.user})
    });

    const data = await res.json();
    console.log("Successful update for:", store.user);
  });
}