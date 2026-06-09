import os, sys
import uvicorn

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, os.getcwd())
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
