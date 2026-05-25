import os
from dotenv import load_dotenv

from authoriser import refresh_access_token

# Import our powerful new combined function
from strava_api import fetch_latest_run_details 
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
        print("\n--- Fetching Latest Run ---")
        
        # 1. Fetch exactly ONE run (both summary and details)
        summary_data, detailed_data = fetch_latest_run_details(fresh_access_token)
        
        if summary_data and detailed_data:
            print(f"Processing: {summary_data.get('name')}")
            
            # 2. Package it perfectly
            final_data = package_comprehensive_run_data(summary_data, detailed_data)
            
            # 3. Send it to Make.com
            if make_webhook_url:
                send_to_make_webhook(make_webhook_url, final_data)
            else:
                print("Skipping Make.com export: No Webhook URL found")