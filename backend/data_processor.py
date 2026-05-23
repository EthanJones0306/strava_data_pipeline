from datetime import datetime

def format_duration(seconds):
    """
    Converts raw seconds into a readable string (e.g., '45m 30s').
    """
    if not seconds:
        return "0m 0s"
    
    minutes, remaining_seconds = divmod(seconds, 60)
    return f"{minutes}m {remaining_seconds}s"

def calculate_pace(speed_meters_per_second):
    """
    Converts speed (meters per second) into pace (Minutes:Seconds per kilometer).
    """
    if not speed_meters_per_second or speed_meters_per_second == 0:
        return "0:00 /km"
        
    pace_seconds_per_km = 1000 / speed_meters_per_second
    minutes, seconds = divmod(int(pace_seconds_per_km), 60)
    
    return f"{minutes}:{seconds:02d} /km"

def format_date(date_string):
    """
    Converts Strava's ISO timestamp (e.g., '2026-05-07T08:06:11Z') 
    into a clean, readable date (e.g., 'May 07, 2026').
    """
    if not date_string:
        return "Unknown Date"
        
    try:
        # 1. Convert the raw string into a Python datetime object
        dt_object = datetime.strptime(date_string, "%Y-%m-%dT%H:%M:%SZ")
        
        # 2. Format the object into a readable string
        # %B = Full month name, %d = Day, %Y = 4-digit Year
        return dt_object.strftime("%B %d, %Y")
        
    except ValueError:
        # Just in case Strava changes their format, this prevents your script from crashing
        return date_string