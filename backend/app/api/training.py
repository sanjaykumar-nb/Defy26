from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
from app.core.database import db

router = APIRouter(tags=["training"])

# We will now use 'db' which persists to storage/jobs.json
# and for coordination, we'll prefix job IDs to distinguish if needed

class TrainingJobCreate(BaseModel):
    requester: str
    script_url: str
    dataset_url: str
    reward: float
    is_confidential: bool = False
    encrypted_threshold: Optional[str] = None

@router.post("/training/jobs")
async def create_training_job(job: TrainingJobCreate):
    """
    Create a new training job and automatically shard it into 10 tasks.
    """
    job_id = str(uuid.uuid4())
    
    # Create 10 shards
    shards = []
    for i in range(10):
        shard = {
            "shard_id": f"{job_id}-shard-{i}",
            "shard_index": i,
            "status": "pending",
            "worker_id": None,
            "progress": 0,
            "result_url": None
        }
        shards.append(shard)
    
    job_data = {
        "id": job_id,
        "type": "training",
        **job.dict(),
        "status": "sharding",
        "created_at": datetime.now().isoformat(),
        "shards": shards,
        "total_shards": 10,
        "completed_shards": 0
    }
    
    # Persist to database
    db.create_job(job_data)
    
    return {"message": "Job created and sharded", "job_id": job_id, "shards_count": 10}

@router.get("/training/jobs")
async def list_training_jobs():
    """List all training jobs and their shard status"""
    # Filtering for training type jobs if needed, but for now return all
    jobs = db._read_file(db.jobs_file)
    return [j for j in jobs if j.get('type') == 'training' or 'shards' in j]

@router.get("/training/jobs/{job_id}")
async def get_training_job(job_id: str):
    """Get details of a specific training job"""
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/training/claim-shard")
async def claim_shard(job_id: str, shard_index: int, worker_id: str):
    """Worker claims a specific shard of a training job"""
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if shard_index >= len(job["shards"]):
        raise HTTPException(status_code=400, detail="Invalid shard index")
    
    shard = job["shards"][shard_index]
    if shard["status"] != "pending":
        raise HTTPException(status_code=400, detail="Shard already claimed or completed")
    
    shard["status"] = "processing"
    shard["worker_id"] = worker_id
    
    # If all shards are claimed, update job status
    if all(s["status"] != "pending" for s in job["shards"]):
        job["status"] = "processing"
        
    db.update_job(job_id, {"shards": job["shards"], "status": job["status"]})
    return {"message": "Shard claimed successfully", "shard_id": shard["shard_id"]}

@router.post("/training/submit-shard")
async def submit_shard(job_id: str, shard_index: int, worker_id: str, result_url: str):
    """Worker submits results for a shard"""
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    shard = job["shards"][shard_index]
    
    if shard["worker_id"] != worker_id:
        raise HTTPException(status_code=403, detail="Not authorized for this shard")
    
    shard["status"] = "completed"
    shard["result_url"] = result_url
    shard["progress"] = 100
    
    job["completed_shards"] += 1
    
    # If all shards are completed, aggregate and finish
    if job["completed_shards"] == job["total_shards"]:
        job["status"] = "completed"
        job["completed_at"] = datetime.now().isoformat()
        
    db.update_job(job_id, {
        "shards": job["shards"], 
        "status": job["status"], 
        "completed_shards": job["completed_shards"],
        "completed_at": job.get("completed_at")
    })
    return {"message": "Shard result submitted", "job_status": job["status"]}
