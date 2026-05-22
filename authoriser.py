import os
import os
import requests
import json
from dotenv import load_dotenv

def refresh_access_token(client_id, client_secret, refresh_token):
    """
    Asks Strava for a brand new Access Token using the Refresh Token.
    """
    auth_url = "https://www.strava.com/oauth/token"
    
    # 1. The data we need to send to Strava to prove who we are
    auth_payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
        "f": "json"
    }
    
    print("Requesting a new Access Token from Strava...")
    # 2. Send a POST request to the authentication URL
    response = requests.post(auth_url, data=auth_payload)
    
    if response.status_code == 200:
        new_token_data = response.json()
        print("Successfully generated a new Access Token!")
        return new_token_data.get("access_token")
    else:
        print(f"Failed to get new token. Status Code: {response.status_code}")
        print(response.text)
        return None

def get_strava_athlete_profile(access_token):
    """
    Fetches the authenticated athlete's profile from the Strava API.
    """
    url = "https://www.strava.com/api/v3/athlete"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    print("Fetching athlete profile...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        athlete_data = response.json()
        print("\nSuccess! Here is your basic profile data:")
        print(f"Name: {athlete_data.get('firstname')} {athlete_data.get('lastname')}")
        print(f"City: {athlete_data.get('city')}")
    else:
        print(f"Error fetching profile: {response.status_code}")

# --- Implementation ---
if __name__ == "__main__":
    load_dotenv()

    # Step A: Get a fresh token
    fresh_access_token = refresh_access_token(
        client_id=os.getenv("CLIENT_ID"), 
        client_secret=os.getenv("CLIENT_SECRET"), 
        refresh_token=os.getenv("REFRESH_TOKEN")
    )
    
    # Step B: Use the fresh token to get your data
    if fresh_access_token:
        get_strava_athlete_profile(fresh_access_token)