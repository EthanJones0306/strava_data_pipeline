import os
import requests
import json
from dotenv import load_dotenv

def get_strava_athlete_profile(access_token):
    '''
    Fetches athlete profile for personal data using strava API
    '''
    url = os.getenv("API_Base_URL") + "/athlete"

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    try:
        print("Fetching athlete profile...")
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            athlete_data = response.json()
            print("Athlete profile fetched successfully.")
            return athlete_data
        else:
            print(f"Failed to fetch athlete profile. Status code: {response.status_code}")
            return None
    except Exception as e:
        print(f"An error occurred while fetching athlete profile: {e}")
        return None
