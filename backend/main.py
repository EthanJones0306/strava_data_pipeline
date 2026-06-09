import os
import log_util
from dotenv import load_dotenv

from authoriser import refresh_access_token
from strava_api import fetch_latest_run_details 
from data_processor import package_comprehensive_run_data
from make_integration import send_to_make_webhook
from run_tracker import is_new_run, mark_run_sent

if __name__ == "__main__":
    load_dotenv()

    fresh_access_token = refresh_access_token(
        client_id=os.getenv("CLIENT_ID"), 
        client_secret=os.getenv("CLIENT_SECRET"), 
        refresh_token=os.getenv("REFRESH_TOKEN")
    )
    
    make_webhook_url = os.getenv("MAKE_WEBHOOK_URL")
    
    if fresh_access_token:
        print("\n--- Fetching Latest Run ---")
        summary_data, detailed_data = fetch_latest_run_details(fresh_access_token)
        
        if summary_data and detailed_data:
            activity_id = summary_data.get("id")
            print(f"Processing: {summary_data.get('name')} (ID: {activity_id})")
            
            if not is_new_run(activity_id):
                print("This run has already been sent — skipping.")
            else:
                final_data = package_comprehensive_run_data(summary_data, detailed_data)
                
                if make_webhook_url:
                    send_to_make_webhook(make_webhook_url, final_data)
                    mark_run_sent(activity_id)