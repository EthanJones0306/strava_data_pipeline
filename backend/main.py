import os
import log_util
from dotenv import load_dotenv

from authoriser import refresh_access_token
from strava_api import fetch_latest_run_details, get_recent_runs
from data_processor import package_comprehensive_run_data
from make_integration import send_to_make_webhook
from run_tracker import is_new_run, mark_run_sent, get_preferred_model, set_preferred_model
from gemini_analysis import analyze_run
from analysis_store import save_analysis, get_analysis
from run_store import seed_from_csv, append_run

if __name__ == "__main__":
    load_dotenv()
    seed_from_csv()

    fresh_access_token = refresh_access_token(
        client_id=os.getenv("CLIENT_ID"), 
        client_secret=os.getenv("CLIENT_SECRET"), 
        refresh_token=os.getenv("REFRESH_TOKEN")
    )
    
    make_webhook_url = os.getenv("MAKE_WEBHOOK_URL")
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    if fresh_access_token:
        print("\n--- Fetching Latest Run ---")
        summary_data, detailed_data = fetch_latest_run_details(fresh_access_token)
        
        if summary_data and detailed_data:
            activity_id = summary_data.get("id")
            print(f"Processing: {summary_data.get('name')} (ID: {activity_id})")
            
            final_data = package_comprehensive_run_data(summary_data, detailed_data)
            
            # --- Step 1: Send to Make (only if new) ---
            print("\n--- Make Integration ---")
            if not is_new_run(activity_id):
                print(f"Run {activity_id} has already been sent to Make — skipping.")
            elif not make_webhook_url:
                print("MAKE_WEBHOOK_URL not set — skipping.")
            else:
                send_to_make_webhook(make_webhook_url, final_data)
                mark_run_sent(activity_id)
                append_run(activity_id, summary_data, detailed_data)
            
            # --- Step 2: Get AI coaching analysis (independent of Make) ---
            print("\n--- AI Coaching Analysis ---")
            if not gemini_api_key:
                print("GEMINI_API_KEY not set — skipping coaching analysis.")
            elif get_analysis(activity_id):
                print(f"Analysis already exists for run {activity_id} — skipping.")
            else:
                recent_runs_raw = get_recent_runs(fresh_access_token, num_runs_wanted=5)
                if not recent_runs_raw:
                    print("Could not fetch recent runs for analysis context.")
                else:
                    preferred_model = get_preferred_model()
                    if preferred_model:
                        print(f"Using preferred model: {preferred_model}")
                    result = analyze_run(final_data, recent_runs_raw, gemini_api_key, preferred_model=preferred_model)
                    if result:
                        save_analysis(activity_id, result["text"], final_data)
                        set_preferred_model(result["model"])
                        print(f"Preferred model saved: {result['model']}")
                    else:
                        print("Analysis failed — nothing saved. Will retry next run.")
        
        else:
            print("No run data found. Cannot proceed.")
    
    else:
        print("Failed to authenticate with Strava.")
