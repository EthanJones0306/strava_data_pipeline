import os, sys, subprocess, signal, time
import uvicorn

PORT = 8000

def free_port(port):
    try:
        pid = subprocess.check_output(
            ["lsof", "-ti", f":{port}"],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        if pid:
            os.kill(int(pid), signal.SIGTERM)
            time.sleep(1)
            print(f"Freed port {port}")
    except (subprocess.CalledProcessError, ValueError, OSError):
        pass

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, os.getcwd())
    free_port(PORT)
    uvicorn.run("api:app", host="0.0.0.0", port=PORT, reload=True)