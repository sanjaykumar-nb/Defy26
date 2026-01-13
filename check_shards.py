import requests
import json

try:
    res = requests.get("http://localhost:8000/api/training/jobs")
    jobs = res.json()
    if jobs:
        latest_job = jobs[-1]
        print(f"Job ID: {latest_job['id']}")
        print(f"Status: {latest_job['status']}")
        print(f"Completed Shards: {latest_job['completed_shards']}/{latest_job['total_shards']}")
        for shard in latest_job['shards']:
            print(f"  Shard {shard['shard_index']}: {shard['status']} (Worker: {shard['worker_id']})")
    else:
        print("No jobs found.")
except Exception as e:
    print(f"Error: {e}")
