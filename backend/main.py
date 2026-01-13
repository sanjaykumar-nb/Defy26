"""
V-Inference Backend - Main Application
Decentralized AI Inference Network with ZKML Verification
"""
import os
import sys
import threading
import subprocess
import argparse
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import models, inference, marketplace, users, workers, training

# ============ Tunneling Manager ============

class TunnelManager:
    """Manages SSH reverse tunneling via Serveo.net for the backend"""
    
    def __init__(self, port: int = 8000):
        self.port = port
        self.public_url = None
        self.process = None
        self.is_connected = False
    
    def start(self, on_connect_callback=None):
        """Start the SSH tunnel in a separate thread"""
        def tunnel_thread():
            # Command: ssh -R 80:localhost:PORT serveo.net
            cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-R", f"80:localhost:{self.port}", "serveo.net"]
            
            try:
                self.process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1
                )
                
                # Monitor output to find the public URL
                for line in self.process.stdout:
                    if "Forwarding HTTP traffic from" in line:
                        self.public_url = line.split("from")[-1].strip()
                        self.is_connected = True
                        print()
                        print("=" * 60)
                        print(f"[BACKEND TUNNEL] Global URL: {self.public_url}")
                        print("=" * 60)
                        print()
                        
                        if on_connect_callback:
                            on_connect_callback(self.public_url)
                    
                    if self.process.poll() is not None:
                        break
                        
            except Exception as e:
                print(f"[TUNNEL] Error starting tunnel: {e}")
                self.is_connected = False
        
        thread = threading.Thread(target=tunnel_thread, daemon=True)
        thread.start()
        print(f"[TUNNEL] Initiating SSH tunnel for backend on port {self.port}...")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("[STARTING] V-Inference Backend Starting...")
    print("[INFO] Initializing storage...")
    print("[SUCCESS] ZKML Simulator ready")
    
    # Seed demo data for presentation
    # from app.core.database import db
    # from app.core.demo_data import seed_demo_data
    # seed_demo_data(db)
    
    print("[SUCCESS] Backend ready to accept connections")
    yield
    # Shutdown
    print("[STOPPING] V-Inference Backend shutting down...")


app = FastAPI(
    title="V-Inference API",
    description="""
    ## Decentralized AI Inference Network with ZKML Verification
    
    V-Inference enables verifiable AI inference on a decentralized network.
    
    ### Features:
    - **Model Management**: Upload, store, and manage AI models
    - **Inference Execution**: Run model inference with ZK proof generation
    - **Marketplace**: List models for others to use, purchase inference credits
    - **ZKML Verification**: Zero-Knowledge proofs ensure correct execution
    
    ### Tech Stack:
    - FastAPI backend
    - EZKL-simulated ZKML proof generation
    - JSON-based storage (simulating Supabase)
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(inference.router, prefix="/api")
app.include_router(marketplace.router, prefix="/api")
app.include_router(workers.router, prefix="/api")
app.include_router(training.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "V-Inference API",
        "version": "1.0.0",
        "description": "Decentralized AI Inference Network with ZKML Verification",
        "docs": "/docs",
        "status": "online",
        "endpoints": {
            "users": "/api/users",
            "models": "/api/models",
            "inference": "/api/inference",
            "marketplace": "/api/marketplace",
            "workers": "/api/workers"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "v-inference-backend",
        "version": "1.0.0"
    }


@app.get("/api/stats")
async def get_platform_stats():
    """Get platform-wide statistics"""
    from app.core.database import db
    
    users = db._read_file(db.users_file)
    models = db._read_file(db.models_file)
    jobs = db._read_file(db.jobs_file)
    listings = db.get_active_listings()
    
    completed_jobs = [j for j in jobs if j.get("status") == "completed"]
    verified_jobs = [j for j in jobs if j.get("status") == "verified" or j.get("proof_hash")]
    
    return {
        "platform": "V-Inference",
        "stats": {
            "total_users": len(users),
            "total_models": len(models),
            "total_inferences": len(jobs),
            "completed_inferences": len(completed_jobs),
            "verified_inferences": len(verified_jobs),
            "active_listings": len(listings),
            "verification_rate": round(len(verified_jobs) / max(len(completed_jobs), 1) * 100, 2)
        },
        "network": {
            "chain": "Base Shardeum",
            "verifier_contract": "0x742d35Cc6634C0532925a3b844Bc9e7595f00000",
            "escrow_contract": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"
        }
    }


if __name__ == "__main__":
    import uvicorn
    parser = argparse.ArgumentParser(description="V-Inference Backend")
    parser.add_argument("--port", type=int, default=8000, help="Local port to run on")
    parser.add_argument("--tunnel", action="store_true", help="Start a global tunnel via Serveo")
    args = parser.parse_args()

    if args.tunnel:
        tunnel = TunnelManager(port=args.port)
        tunnel.start()

    uvicorn.run(app, host="0.0.0.0", port=args.port)
