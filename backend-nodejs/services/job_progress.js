progress = new Map();

export async function start(jobId) {
  progress.set(jobId, {
    "status": "rendering",
    "job_id": jobId,
    "ready": false,
    "progress": 0.0
  });
}

export async function complete(jobId) {
  if (progress.has(jobId)) {
    progress.set(jobId, {
      "status": "complete",
      "job_id": jobId,
      "ready": true,
      "progress": 1.0
    });
  }
}

export async function update(jobId, status, value) {
    if (progress.has(jobId)) {
        progress[jobId]["status"] = status;
        progress[jobId]["progress"] = value;
    }
}

export async function get(jobId) {
  if (progress.has(jobId)) {
    return progress[jobId];
  }
}