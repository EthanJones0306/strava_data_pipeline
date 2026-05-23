import os
from dotenv import load_dotenv

from authoriser import refresh_access_token
from strava_api import get_strava_athlete_profile, get_recent_activities
from data_processor import format_duration, calculate_pace
from make_integration import send_to_make_webhook

from data_processor import format_duration, calculate_pace, format_date

if __name__ == "__main__":
    load_dotenv()

    fresh_access_token = refresh_access_token(
        client_id=os.getenv("CLIENT_ID"), 
        client_secret=os.getenv("CLIENT_SECRET"), 
        refresh_token=os.getenv("REFRESH_TOKEN")
    )
    
    # Grab the webhook URL from our secure file
    make_webhook_url = os.getenv("MAKE_WEBHOOK_URL")
    
    if fresh_access_token:
        # Fetch the activities data (getting a batch of 10 to filter)
        activities_data = get_recent_activities(fresh_access_token, num_activities=10)
        
        if activities_data:
            print("\n--- Processing Runs ---")
            for activity in activities_data:
                
                # Filter for runs only
                if activity.get('sport_type') == 'Run':
                    name = activity.get('name')
                    distance_km = round(activity.get('distance', 0) / 1000, 2)
                    moving_time = format_duration(activity.get('moving_time', 0))
                    pace = calculate_pace(activity.get('average_speed', 0))
                    
                    # Package the clean data into a dictionary
                    clean_run_data = {
                        "run_name": name,
                        "distance_km": distance_km,
                        "time": moving_time,
                        "pace": pace,
                        # Wrap the date right here!
                        "date": format_date(activity.get('start_date_local')) 
                    }
                    
                    print(f"Prepared data for: {name}")
                    
                    # Send it to Make.com
                    if make_webhook_url:
                        send_to_make_webhook(make_webhook_url, clean_run_data)
                    else:
                        print("Skipping Make.com export: No Webhook URL found in .env")