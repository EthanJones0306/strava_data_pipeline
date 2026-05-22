import requests

def get_strava_athlete_profile(access_token):
    """
    Fetches the authenticated athlete's profile from the Strava API.
    Returns the data as a Python dictionary.
    """
    url = "https://www.strava.com/api/v3/athlete"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    print("Fetching athlete profile...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json() # Returning the data instead of printing it!
    else:
        print(f"Error fetching profile: {response.status_code}")
        return None

def get_recent_activities(access_token, num_activities=5):
    """
    Fetches the authenticated athlete's recent activities from the Strava API.
    Returns a list of activity dictionaries.
    """
    url = "https://www.strava.com/api/v3/athlete/activities"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    params = {
        "per_page": num_activities
    }
    
    print(f"Fetching your {num_activities} most recent activities...")
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json() # Returning the data!
    else:
        print(f"Error fetching activities: {response.status_code}")
        return None