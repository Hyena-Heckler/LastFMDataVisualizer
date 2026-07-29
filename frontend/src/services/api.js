// services/api.js

import { store } from "../store.js";

const backend_server = import.meta.env.VITE_API_URL;

export async function fetchCache() {
  const res = await fetch(`${backend_server}/download-cache`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user: store.user
    })
  });

  store.cache = await res.json();
}

export async function updateUser() {
  // Step 1: Start the updating process
  const res = await fetch(`${backend_server}/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user: store.user
    })
  });

  const { jobId } = await res.json(); // Updating takes a long time sometimes, so there is an issue of it timing out. This allows it to run in the background.
  console.log("Job started:", jobId);

  // Step 2: Check to see if updating process is done
  let ready = false;

  while (!ready) {
    const statusRes = await fetch(
      `${backend_server}/update-status/${jobId}`
    );

    const statusData = await statusRes.json();

    ready = statusData.ready;

    if (!ready) {
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}