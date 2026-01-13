import sys
import os
import subprocess
import time
import threading
import signal
from pathlib import Path

# Colors for terminal
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

processes = []

def signal_handler(sig, frame):
    print(f"\n{Colors.WARNING}STOP Shutting down V-OBLIVION Mesh...{Colors.ENDC}")
    for p in processes:
        try:
            p.terminate()
        except:
            pass
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def run_backend():
    print(f"{Colors.OKBLUE}Starting Backend with Global Tunnel...{Colors.ENDC}")
    # Run uvicorn directly or the main.py
    cmd = [sys.executable, "main.py", "--tunnel"]
    env = os.environ.copy()
    env["PYTHONPATH"] = "."
    p = subprocess.Popen(cmd, cwd="backend", stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, env=env)
    processes.append(p)
    
    # Extract Global URL
    backend_url = None
    for line in p.stdout:
        print(f"  [BACKEND] {line.strip()}")
        if "[BACKEND TUNNEL] Global URL:" in line:
            backend_url = line.split("Global URL:")[-1].strip()
            print(f"\n{Colors.OKGREEN}BACKEND EXPOSED AT: {backend_url}{Colors.ENDC}\n")
            # For LOCAL master worker, we use localhost for reliability
            # But we still update .env just in case, using local URL
            update_worker_env("http://localhost:8000")
        if "Uvicorn running on" in line and backend_url:
            break

def update_worker_env(url):
    env_path = Path("worker/.env")
    lines = []
    if env_path.exists():
        try:
            lines = env_path.read_text().splitlines()
        except:
            lines = []
    
    new_lines = []
    found = False
    for line in lines:
        if line.startswith("BACKEND_URL="):
            new_lines.append(f"BACKEND_URL={url}")
            found = True
        else:
            new_lines.append(line)
    
    if not found:
        new_lines.append(f"BACKEND_URL={url}")
    
    env_path.write_text("\n".join(new_lines))
    print(f"{Colors.OKCYAN}Updated worker/.env with backend URL: {url}{Colors.ENDC}")

def run_frontend():
    print(f"{Colors.OKBLUE}Starting Frontend...{Colors.ENDC}")
    # Using npm run dev which starts on 3000 by default
    cmd = ["npm.cmd", "run", "dev"] if os.name == 'nt' else ["npm", "run", "dev"]
    p = subprocess.Popen(cmd, cwd="frontend", stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    processes.append(p)
    print(f"{Colors.OKGREEN}Frontend starting on http://localhost:3000{Colors.ENDC}")

def run_worker():
    print(f"{Colors.OKBLUE}Starting Local Master Worker...{Colors.ENDC}")
    cmd = [sys.executable, "decentralized_worker.py"]
    env = os.environ.copy()
    env["PYTHONPATH"] = "."
    p = subprocess.Popen(cmd, cwd="worker", stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, env=env)
    processes.append(p)
    
    # Thread to monitor worker output
    def monitor():
        for line in p.stdout:
            if "WORKER" in line or "MESH" in line:
                print(f"  {Colors.OKCYAN}[WORKER]{Colors.ENDC} {line.strip()}")
    
    threading.Thread(target=monitor, daemon=True).start()

def main():
    print(f"{Colors.HEADER}{Colors.BOLD}")
    print("=" * 60)
    print("   V-OBLIVION MESH AUTOMATIC DEPLOYER")
    print("=" * 60)
    print(f"{Colors.ENDC}")

    # 1. Start Backend and wait for tunnel
    backend_thread = threading.Thread(target=run_backend)
    backend_thread.start()
    
    # Give it a moment to initialize the tunnel
    time.sleep(10)
    
    # 2. Start Frontend
    run_frontend()
    
    # 3. Start Local Worker (Master)
    run_worker()
    
    print(f"\n{Colors.OKGREEN}MESH FULLY OPERATIONAL{Colors.ENDC}")
    print(f"{Colors.BOLD}Press Ctrl+C to shut down all services.{Colors.ENDC}\n")
    
    # Keep main thread alive
    while True:
        time.sleep(1)

if __name__ == "__main__":
    main()
