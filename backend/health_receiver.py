from fastapi import FastAPI, Request
import json
import urllib.parse
import uvicorn

app = FastAPI()

@app.post("/api/health")
async def receive_health(request: Request):
    # Catch the raw data, 
    raw_bytes = await request.body()
    raw_str = raw_bytes.decode("utf-8")
    
    # Fix the format of Apple shortcuts data
    cleaned_str = urllib.parse.unquote_plus(raw_str)
    if cleaned_str.endswith('='):
        cleaned_str = cleaned_str[:-1]
        
    print("\n--- RAW DATA RECEIVED ---")
    print(cleaned_str)
    
    try:
        data = json.loads(cleaned_str)
        
        print("\n--- PARSED SUCCESSFULLY ---")
        print(f"Date: {data.get('date')}")
        print(f"Steps: {data.get('steps')}")
        print("---------------------------\n")
        
        
        return {"status": "success", "msg": "Data successfully caught and parsed!"}
        
    except json.JSONDecodeError:
        print("Failed to decode JSON. Check the raw data output above.")
        return {"status": "error", "msg": "Bad JSON format"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)