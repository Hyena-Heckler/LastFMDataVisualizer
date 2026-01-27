// for all buttons


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

document.getElementById("download").addEventListener("click", async () => {
  const res = await fetch("http://localhost:3000/download");
  const data = await res.json();
  downloadJSON(data, "Data");
})

document.getElementById("update").addEventListener("click", async () => {
  const res = await fetch("http://localhost:3000/update");
  const data = await res.json();
  downloadJSON(data, "Data");
})
