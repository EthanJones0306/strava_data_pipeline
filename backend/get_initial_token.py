import requests
import os
from dotenv import load_dotenv

def exchange_code_for_token(client_id, client_secret, auth_code):
    auth_url = "https://www.strava.com/oauth/token"
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": auth_code,
        "grant_type": "authorization_code"
    }
    
    print("Exchanging code for tokens...")
    response = requests.post(auth_url, data=payload)
    
    if response.status_code == 200:
        data = response.json()
        print("\nSuccess! Here is your NEW Refresh Token. Update your .env file with this:")
        print(f"Refresh Token: {data.get('refresh_token')}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":

    load_dotenv()
    CLIENT_ID = os.getenv("CLIENT_ID") # "YOUR_CLIENT
    CLIENT_SECRET = os.getenv("CLIENT_SECRET") # "YOUR_CLIENT_SECRET"

    # One time code 
    AUTH_CODE = "17a02f846b18eceb78a2c3b9a4e67cf976ab9460" 
    
    exchange_code_for_token(CLIENT_ID, CLIENT_SECRET, AUTH_CODE)