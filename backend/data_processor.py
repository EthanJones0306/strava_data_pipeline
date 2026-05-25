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
        # Convert the raw string into a Python datetime object
        dt_object = datetime.strptime(date_string, "%Y-%m-%dT%H:%M:%SZ")
        
        # Format the object into a readable string
        # %B = Full month name, %d = Day, %Y = 4-digit Year
        return dt_object.strftime("%B %d, %Y")
        
    except ValueError:
        return date_string
    
def package_comprehensive_run_data(summary_data, detailed_data):
    """
    Combines Level 1 Summary data and Level 2 Detailed data into one clean dictionary.
    Now includes advanced Splits and Best Efforts!
    """
    distance_km = round(summary_data.get('distance', 0) / 1000, 2)
    moving_time = format_duration(summary_data.get('moving_time', 0))
    pace = calculate_pace(summary_data.get('average_speed', 0))
    clean_date = format_date(summary_data.get('start_date_local'))
    
    # Detailed Data Extractions
    calories = detailed_data.get('calories', 0) if detailed_data else 0
    description = detailed_data.get('description', 'No description') if detailed_data else 'No description'
    gear = detailed_data.get('gear', {}).get('name', 'Unknown Gear') if detailed_data else 'Unknown Gear'
    
    # Advanced Analytics Formatters
    raw_splits = detailed_data.get('splits_metric', []) if detailed_data else []
    formatted_splits = format_splits(raw_splits)
    
    raw_best_efforts = detailed_data.get('best_efforts', []) if detailed_data else []
    formatted_best_efforts = format_best_efforts(raw_best_efforts)

    # The full dictionary
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
        
        # Level 2 Details
        "calories": calories,
        "gear_used": gear,
        
        # Advanced Analytics Strings
        "splits": formatted_splits,
        "best_efforts": formatted_best_efforts
    }
    
    return clean_run_data

def format_splits(splits_data):
    """
    Takes the raw splits_metric list from Strava and formats it into a highly detailed string.
    Includes Time, Pace, Grade Adjusted Pace (GAP), Elevation, Heart Rate, and Pace Zone.
    """
    if not splits_data:
        return "No splits recorded."
        
    split_strings = []
    
    for split in splits_data:
        lap = split.get('split')
        
        # 1. Moving Time for the lap
        moving_time_sec = split.get('moving_time', 0)
        minutes, seconds = divmod(moving_time_sec, 60)
        time_str = f"{minutes}m{seconds:02d}s"
        
        # 2. Actual Pace
        speed = split.get('average_speed', 0)
        pace = calculate_pace(speed)
        
        # 3. Grade Adjusted Pace (GAP)
        gap_speed = split.get('average_grade_adjusted_speed', 0)
        gap_pace = calculate_pace(gap_speed) if gap_speed else "N/A"
        
        # 4. Elevation
        elev = split.get('elevation_difference', 0)
        elev_str = f"+{elev}m" if elev > 0 else f"{elev}m"
        
        # 5. Heart Rate
        hr = split.get('average_heartrate')
        hr_str = f"{round(hr)} bpm" if hr else "No HR"
        
        # 6. Pace Zone
        zone = split.get('pace_zone', 'N/A')
        
        # Build the sring for this split with all the data
        # Example: "KM 1: 6m30s @ 6:29/km (GAP: 6:05/km) | +3.2m | 122 bpm | Zone 1"
        detailed_lap = f"KM {lap}: {time_str} @ {pace} (GAP: {gap_pace}) | {elev_str} | {hr_str} | Zone {zone}"
        
        split_strings.append(detailed_lap)
        
    # Join all laps together with a clear divider
    return " || ".join(split_strings)

def format_best_efforts(best_efforts_data):
    """
    Takes the raw best_efforts list and formats it into a readable string.
    Example: '400m: 1m29s | 1K: 3m45s | 1 mile: 6m10s'
    """
    if not best_efforts_data:
        return "No best efforts recorded."
        
    efforts_strings = []
    
    for effort in best_efforts_data:
        name = effort.get('name', 'Unknown')
        
        # Grab the time and format it 
        moving_time_sec = effort.get('moving_time', 0)
        minutes, seconds = divmod(moving_time_sec, 60)
        time_str = f"{minutes}m {seconds:02d}s"
        
        efforts_strings.append(f"{name}: {time_str}")
        
    return " | ".join(efforts_strings)