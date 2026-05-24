import os
from dotenv import load_dotenv

from authoriser import refresh_access_token

from strava_api import get_strava_athlete_profile, get_recent_activities, get_activity_details

from data_processor import package_comprehensive_run_data
from make_integration import send_to_make_webhook

if __name__ == "__main__":
    load_dotenv()

    fresh_access_token = refresh_access_token(
        client_id=os.getenv("CLIENT_ID"), 
        client_secret=os.getenv("CLIENT_SECRET"), 
        refresh_token=os.getenv("REFRESH_TOKEN")
    )
    
    make_webhook_url = os.getenv("MAKE_WEBHOOK_URL")
    
    if fresh_access_token:
        activities_data = get_recent_activities(fresh_access_token, num_activities=10)
        
        if activities_data:
            print("\n--- Processing Runs ---")
            for activity in activities_data:
                
                if activity.get('sport_type') == 'Run':
                    print(f"\nProcessing: {activity.get('name')}")
                    
                    # 1. Grab the unique ID for this specific run
                    activity_id = activity.get('id')
                    
                    # 2. Fetch the Level 2 detailed data
                    detailed_data = get_activity_details(fresh_access_token, activity_id)
                    
                    # 3. Delegate the math and packaging to our processor!
                    final_data = package_comprehensive_run_data(activity, detailed_data)
                    
                    # 4. Send to Make.com
                    if make_webhook_url:
                        send_to_make_webhook(make_webhook_url, final_data)
                    else:
                        print("Skipping Make.com export: No Webhook URL found")