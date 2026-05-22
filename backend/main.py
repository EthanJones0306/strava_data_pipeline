import os
from dotenv import load_dotenv

from authoriser import refresh_access_token
from strava_api import get_strava_athlete_profile, get_recent_activities, get_recent_runs

if __name__ == "__main__":
    load_dotenv()

    # Step A: Get a fresh token
    fresh_access_token = refresh_access_token(
        client_id=os.getenv("CLIENT_ID"), 
        client_secret=os.getenv("CLIENT_SECRET"), 
        refresh_token=os.getenv("REFRESH_TOKEN")
    )
    
    # Step B: Use the fresh token to fetch and display your data
    if fresh_access_token:
        
        # 1. Fetch the profile data
        profile_data = get_strava_athlete_profile(fresh_access_token)
        
        if profile_data:
            print("\n--- Profile Data ---")
            print(f"Name: {profile_data.get('firstname')} {profile_data.get('lastname')}")
        
        # 2. Fetch the activities data
        activities_data = get_recent_activities(fresh_access_token, num_activities=5)
        run_data = get_recent_runs(fresh_access_token, num_runs_wanted=5)

        if run_data:
            print("\n--- Recent Runs ---")
            for index, activity in enumerate(run_data, start=1):
                name = activity.get('name')
                sport_type = activity.get('sport_type')
                
                # We can do the math right here in our main file for now
                distance_km = round(activity.get('distance', 0) / 1000, 2)
                
                print(f"{index}. {name} | {sport_type} | {distance_km} km")
        
        if activities_data:
            print("\n--- Recent Activities ---")
            for index, activity in enumerate(activities_data, start=1):
                name = activity.get('name')
                sport_type = activity.get('sport_type')
                
                # We can do the math right here in our main file for now
                distance_km = round(activity.get('distance', 0) / 1000, 2)
                
                print(f"{index}. {name} | {sport_type} | {distance_km} km")