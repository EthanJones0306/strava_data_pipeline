import os
import sys
import log_util
from datetime import datetime
from dotenv import load_dotenv

from authoriser import refresh_access_token
from strava_api import get_recent_runs, get_activity_details
from data_processor import package_comprehensive_run_data
from make_integration import send_to_make_webhook

def find_run_by_date(runs, target_date):
    """
    Finds a run from the list that matches the target date.
    target_date format: 'YYYY-MM-DD' (e.g., '2026-05-28')
    Returns the run dictionary if found, None otherwise.
    """
    for run in runs:
        # Extract date from ISO timestamp (e.g., '2026-05-28T08:02026-05-286:11Z')
        run_date_str = run.get('start_date_local', '')
        run_date = run_date_str.split('T')[0]  # Get just the date part
        
        if run_date == target_date:
            print(f"✓ Found run on {target_date}: '{run.get('name')}'")
            return run
    
    print(f"✗ No run found for date: {target_date}")
    return None

if __name__ == "__main__":
    load_dotenv()
    
    # Get target date from command line or user input
    if len(sys.argv) > 1:
        target_date = sys.argv[1]  # Format: YYYY-MM-DD
    else:
        target_date = input("Enter the date of the run (YYYY-MM-DD): ")
    
    # Validate date format
    try:
        datetime.strptime(target_date, "%Y-%m-%d")
    except ValueError:
        print("Invalid date format. Please use YYYY-MM-DD (e.g., 2026-05-28)")
        sys.exit(1)
    
    print(f"\n--- Looking for run on {target_date} ---")
    
    # Refresh access token
    fresh_access_token = refresh_access_token(
        client_id=os.getenv("CLIENT_ID"),
        client_secret=os.getenv("CLIENT_SECRET"),
        refresh_token=os.getenv("REFRESH_TOKEN")
    )
    
    make_webhook_url = os.getenv("MAKE_WEBHOOK_URL")
    
    if fresh_access_token:
        # Fetch 5 most recent runs
        print("\n--- Fetching 5 Most Recent Runs ---")
        recent_runs = get_recent_runs(fresh_access_token, num_runs_wanted=5)
        
        if recent_runs:
            # Find the run matching the target date
            target_run = find_run_by_date(recent_runs, target_date)
            
            if target_run:
                activity_id = target_run.get('id')
                
                # Get detailed data for this run
                print(f"\n--- Fetching Detailed Data ---")
                detailed_data = get_activity_details(fresh_access_token, activity_id)
                
                if detailed_data:
                    # Package the comprehensive run data
                    print(f"\n--- Processing Run Data ---")
                    final_data = package_comprehensive_run_data(target_run, detailed_data)
                    
                    # Send to Make
                    if make_webhook_url:
                        print(f"\n--- Sending to Make ---")
                        send_to_make_webhook(make_webhook_url, final_data)
                        print("\n✓ Successfully completed!")
                    else:
                        print("ERROR: MAKE_WEBHOOK_URL not found in environment variables")
                else:
                    print("ERROR: Could not fetch detailed data for the run")
            else:
                print("\nRecent runs available:")
                for run in recent_runs:
                    run_date = run.get('start_date_local', '').split('T')[0]
                    print(f"  - {run_date}: {run.get('name')}")
        else:
            print("ERROR: Could not fetch recent runs")
    else:
        print("ERROR: Could not refresh access token")
