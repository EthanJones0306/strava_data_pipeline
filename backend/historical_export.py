import os
import csv
import time
from dotenv import load_dotenv

from authoriser import refresh_access_token
from strava_api import get_recent_activities, get_activity_details
from data_processor import package_comprehensive_run_data

def export_to_csv(data_list, filename="historical_runs.csv"):
    """
    Takes a list of processed run dictionaries and writes them to a CSV file.
    """
    if not data_list:
        print("No data to export.")
        return

    # Grab the keys from the first dictionary to use as CSV headers
    headers = data_list[0].keys()

    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=headers)
        writer.writeheader()
        for run in data_list:
            writer.writerow(run)
            
    print(f"\n Successfully exported {len(data_list)} runs to {filename}!")

if __name__ == "__main__":
    load_dotenv()

    fresh_access_token = refresh_access_token(
        client_id=os.getenv("CLIENT_ID"), 
        client_secret=os.getenv("CLIENT_SECRET"), 
        refresh_token=os.getenv("REFRESH_TOKEN")
    )
    
    if fresh_access_token:
        # Ask for a large pool of activities to filter through and find all runs
        print("Fetching activity list from Strava...")
        activities_data = get_recent_activities(fresh_access_token, num_activities=150)
        
        processed_runs = []
        
        if activities_data:
            print(f"Found {len(activities_data)} total activities. Filtering for runs...\n")
            
            for activity in activities_data:
                if activity.get('sport_type') == 'Run':
                    run_name = activity.get('name')
                    activity_id = activity.get('id')
                    print(f"Processing: {run_name}...")
                    
                    # Fetch detailed data
                    detailed_data = get_activity_details(fresh_access_token, activity_id)
                    
                    # Package it 
                    final_data = package_comprehensive_run_data(activity, detailed_data)
                    processed_runs.append(final_data)
                    
                    # RATE LIMITING: Sleep for 1.5 seconds to protect API limits
                    time.sleep(1.5) 
            
            # Export all packaged runs to CSV
            export_to_csv(processed_runs)