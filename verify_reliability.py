import requests
import time
import json
import uuid

BACKEND_URL = "http://localhost:8000"
WORKER_URL = "http://localhost:9000"

def test_job_lifecycle():
    print("🚀 Starting Reliability Test...")
    
    # 1. Check if backend is up
    try:
        res = requests.get(f"{BACKEND_URL}/health")
        print(f"✅ Backend status: {res.json()['status']}")
    except Exception as e:
        print(f"❌ Backend not reachable: {e}")
        return

    # 2. Check if worker is up
    try:
        res = requests.get(f"{WORKER_URL}/health")
        print(f"✅ Worker status: {res.json()['status']}")
    except Exception as e:
        print(f"❌ Worker not reachable: {e}")
        return

    # 3. Create a training job manually
    print("\n📝 Creating a simulated training job...")
    job_payload = {
        "requester": "0xTestRequester",
        "script_url": "ipfs://QmTestScript",
        "dataset_url": "ipfs://QmTestData",
        "reward": 1.0,
        "is_confidential": True,
        "encrypted_threshold": "0xdeadbeef" # Test valid hex
    }
    
    try:
        res = requests.post(f"{BACKEND_URL}/api/training/jobs", json=job_payload)
        job_data = res.json()
        job_id = job_data["job_id"]
        print(f"✅ Job created: {job_id} with {job_data['shards_count']} shards")
    except Exception as e:
        print(f"❌ Job creation failed: {e}")
        return

    # 4. Monitor the mesh and worker for 30 seconds
    print(f"\n⏳ Monitoring mesh for 30s as worker processes shards...")
    start_time = time.time()
    
    while time.time() - start_time < 30:
        # Check Job status
        try:
            job_res = requests.get(f"{BACKEND_URL}/api/training/jobs/{job_id}")
            job = job_res.json()
            completed = job["completed_shards"]
            status = job["status"]
            
            # Check Worker status
            worker_res = requests.get(f"{WORKER_URL}/stats")
            worker = worker_res.json()
            current_shard = worker.get("current_shard")
            shards_done = worker.get("shards_completed")
            
            print(f"   [{int(time.time() - start_time)}s] Job Status: {status} | Shards: {completed}/10 | Worker Shards: {shards_done} | Current: {current_shard}")
            
            if status == "completed":
                print("\n🎉 TEST SUCCESS: Job completed successfully through the mesh!")
                return
                
        except Exception as e:
            print(f"   ⚠️ Error during monitoring: {e}")
            
        time.sleep(5)

    print("\n⚠️ Test timed out. Check worker logs.")

if __name__ == "__main__":
    test_job_lifecycle()
