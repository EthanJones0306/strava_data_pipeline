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
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching profile: {e}")
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
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching activities: {e}")
        return None
    
def get_recent_runs(access_token, num_runs_wanted=5):
    """
    Fetches a specific number of recent RUN activities from the Strava API.
    Returns a list of activity dictionaries.
    """
    url = "https://www.strava.com/api/v3/athlete/activities"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    params = {
        # Get large pool of activities to filter through 
        "per_page": 30 
    }

    print(f"Fetching data to find your {num_runs_wanted} most recent runs...")
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()

        runs = []
        for activity in response.json():
            if activity.get('sport_type') == 'Run':
                runs.append(activity)
                if len(runs) == num_runs_wanted:
                    break
        return runs
    except requests.exceptions.RequestException as e:
        print(f"Error fetching runs: {e}")
        return None
    
def get_activity_details(access_token, activity_id):
    """
    Fetches the Level 2 detailed data for a specific activity ID.
    Returns the detailed dictionary.
    """
    url = f"https://www.strava.com/api/v3/activities/{activity_id}"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    print(f"   ↳ Fetching Level 2 details for activity ID: {activity_id}...")
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"   ↳ Error fetching details: {e}")
        return None
    
def fetch_latest_run_details(access_token):
    """
    Combines the above functions to fetch the most recent run and its details in one go.
    Returns a tuple of (summary_data, detailed_data) for the latest run.
    """
    recent_runs = get_recent_runs(access_token, num_runs_wanted=1)
    
    if recent_runs:
        latest_run = recent_runs[0] # Get the most recent run (first in the list)
        activity_id = latest_run.get('id')
        
        detailed_data = get_activity_details(access_token, activity_id)
        
        return latest_run, detailed_data
    else:
        print("No runs found.")
        return None, None