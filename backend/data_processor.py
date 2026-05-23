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