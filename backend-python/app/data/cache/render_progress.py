progress = {}

def start(job_id):
    progress[job_id] = {
        "status": "rendering",
        "job_id" : job_id,
        "ready": False,
        "progress": 0.0
    }

def update(job_id, value):
    if job_id in progress:
        progress[job_id]["progress"] = value

def complete(job_id):
    if job_id in progress:
        progress[job_id]["status"] = "complete"
        progress[job_id]["ready"] = True
        progress[job_id]["progress"] = 1.0

def get(job_id):
    return progress.get(job_id, {
        "status": "unknown",
        "job_id": job_id,
        "ready": False,
        "progress": 0.0
    })