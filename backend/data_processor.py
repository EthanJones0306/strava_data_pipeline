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
    
def package_comprehensive_run_data(summary_data, detailed_data):
    """
    Combines Level 1 Summary data and Level 2 Detailed data into one clean dictionary.
    """
    distance_km = round(summary_data.get('distance', 0) / 1000, 2)
    moving_time = format_duration(summary_data.get('moving_time', 0))
    pace = calculate_pace(summary_data.get('average_speed', 0))
    clean_date = format_date(summary_data.get('start_date_local'))
    
    calories = detailed_data.get('calories', 0) if detailed_data else 0
    description = detailed_data.get('description', 'No description') if detailed_data else 'No description'
    gear = detailed_data.get('gear', {}).get('name', 'Unknown Gear') if detailed_data else 'Unknown Gear'
    
    # NEW: Grab the raw splits and pass them to our new formatter!
    raw_splits = detailed_data.get('splits_metric', []) if detailed_data else []
    formatted_splits = format_splits(raw_splits)

    clean_run_data = {
        "run_name": summary_data.get('name'),
        "date": clean_date,
        "description": description,
        
        # Distance & Time
        "distance_km": distance_km,
        "moving_time": moving_time,
        "pace": pace,
        
        # Elevation
        "elevation_gain_m": summary_data.get('total_elevation_gain', 0),
        "highest_elevation_m": summary_data.get('elev_high', 0),
        
        # Power & Mechanics
        "average_watts": summary_data.get('average_watts', 0),
        "device_watts": summary_data.get('device_watts', False),
        "average_cadence": summary_data.get('average_cadence', 0),
        
        # Heart Rate & Effort
        "average_hr": summary_data.get('average_heartrate', 'N/A') if summary_data.get('has_heartrate') else 'N/A',
        "max_hr": summary_data.get('max_heartrate', 'N/A') if summary_data.get('has_heartrate') else 'N/A',
        "suffer_score": summary_data.get('suffer_score', 'N/A'),
        
        "calories": calories,
        "gear_used": gear,
        
        # NEW: Add the formatted string to the dictionary
        "splits": formatted_splits
    }
    
    return clean_run_data

def format_splits(splits_data):
    """
    Takes the raw splits_metric list from Strava and formats it into a readable string for AI consumption.
    """
    if not splits_data:
        return "No splits recorded."
        
    split_strings = []
    
    # Loop through each kilometer lap
    for split in splits_data:
        lap = split.get('split')
        
        # Calculate the pace for this specific lap
        speed = split.get('average_speed', 0)
        pace = calculate_pace(speed)
        
        # Get the elevation change for this lap
        elev = split.get('elevation_difference', 0)
        
        # Format it nicely and add it to our list
        # Example output: "KM 1: 5:30 /km (+12m)"
        # We use a + sign for positive elevation to make it clearer for the AI
        elev_str = f"+{elev}m" if elev > 0 else f"{elev}m"
        split_strings.append(f"KM {lap}: {pace} ({elev_str})")
        
    # Join all the laps together with a divider so it fits neatly into one text box in Google Docs
    return " | ".join(split_strings)