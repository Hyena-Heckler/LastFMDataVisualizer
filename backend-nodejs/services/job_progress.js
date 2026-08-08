let progress = new Map();

export function start(jobId) {
  progress.set(jobId, {
    "status": "rendering",
    "job_id": jobId,
    "ready": false,
    "progress": 0.0
  });
}

export function complete(jobId) {
  if (progress.has(jobId)) {
    progress.set(jobId, {
      "status": "complete",
      "job_id": jobId,
      "ready": true,
      "progress": 1.0
    });
  }
}

export function update(jobId, status, value) {
  const job = progress.get(jobId);
  if (job) {
      job.status = status;
      job.progress = value;
  }
}

export function get(jobId) {
  if (progress.has(jobId)) {
    return progress.get(jobId);
  }
}