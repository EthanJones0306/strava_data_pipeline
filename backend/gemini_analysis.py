import time
import re
from google import genai
from google.genai import errors as genai_errors

FALLBACK_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
]


def _format_run_context(run, index):
    dist_km = round(run.get("distance", 0) / 1000, 2)
    moving_time = run.get("moving_time", 0)
    minutes, seconds = divmod(moving_time, 60)
    time_str = f"{minutes}m {seconds}s"
    avg_speed = run.get("average_speed", 0)
    pace_sec = 1000 / avg_speed if avg_speed else 0
    pace_str = f"{int(pace_sec // 60)}:{int(pace_sec % 60):02d} /km" if pace_sec else "N/A"
    hr = run.get("average_heartrate", "N/A")
    if hr and hr != "N/A":
        hr = round(hr)

    return (
        f"Run {index}: {run.get('name', 'Unnamed')} "
        f"| {run.get('start_date_local', '').split('T')[0]}"
        f" | {dist_km}km in {time_str} @ {pace_str}"
        f" | HR: {hr} bpm"
        f" | Elevation: {run.get('total_elevation_gain', 0)}m"
        f" | Watts: {run.get('average_watts', 'N/A')}"
    )


def _extract_retry_delay(error):
    raw = str(error)
    match = re.search(r"retry in (\d+(?:\.\d+)?)s", raw, re.IGNORECASE)
    if match:
        return float(match.group(1))
    match = re.search(r"retryDelay.*?(\d+)s", raw)
    if match:
        return float(match.group(1))
    return 30


def _build_prompt(latest, context_lines):
    return f"""You are a data-driven running coach. Analyze this latest run using the context of the 5 most recent runs to provide personalised coaching insights.

## LATEST RUN
- Name: {latest.get('run_name')}
- Date: {latest.get('date')}
- Distance: {latest.get('distance_km')} km
- Moving Time: {latest.get('moving_time')}
- Avg Pace: {latest.get('pace')}
- Avg Heart Rate: {latest.get('average_hr')}
- Max Heart Rate: {latest.get('max_hr')}
- Elevation Gain: {latest.get('elevation_gain_m')} m
- Average Watts: {latest.get('average_watts')} W
- Average Cadence: {latest.get('average_cadence')} spm
- Suffer Score: {latest.get('suffer_score')}
- Calories: {latest.get('calories')}
- Gear Used: {latest.get('gear_used')}

## KILOMETRE SPLITS
{latest.get('splits', 'No split data')}

## BEST EFFORTS
{latest.get('best_efforts', 'No best efforts recorded')}

## RECENT RUN HISTORY (for comparison)
{chr(10).join(context_lines) if context_lines else 'No recent context runs available.'}

## INSTRUCTION
Provide a concise coaching analysis covering:
1. **Pacing** — was the pace consistent across splits? Any positive/negative splitting?
2. **Heart Rate** — how did HR respond to effort? Any anomalies compared to recent runs?
3. **Performance** — how does this run compare to the recent ones? Fitness trend?
4. **One Actionable Tip** — the single most impactful thing to improve next time.

Keep the analysis to 3-4 short paragraphs. Be specific with numbers, not generic."""


def analyze_run(latest_comprehensive, recent_runs_raw, api_key):
    client = genai.Client(api_key=api_key)

    context_runs = recent_runs_raw[1:] if len(recent_runs_raw) > 1 else []
    context_lines = [
        _format_run_context(r, i + 2)
        for i, r in enumerate(context_runs)
        if r.get("sport_type") == "Run"
    ]

    prompt = _build_prompt(latest_comprehensive, context_lines)

    last_error = None
    for attempt, model in enumerate(FALLBACK_MODELS):
        try:
            print(f"Sending run to Gemini for analysis (model: {model})...")
            response = client.models.generate_content(model=model, contents=prompt)
            print("Analysis received from Gemini.")
            return response.text

        except genai_errors.ClientError as e:
            last_error = e
            if e.code == 429:
                delay = _extract_retry_delay(e)
                if attempt < len(FALLBACK_MODELS) - 1:
                    print(f"Model {model} hit rate limit (retry in {delay:.0f}s). Trying next model...")
                    time.sleep(min(delay, 5))
                else:
                    print(f"All models hit rate limits. Last retry was {delay:.0f}s.")
            else:
                print(f"Model {model} failed: {e}")
                if attempt < len(FALLBACK_MODELS) - 1:
                    print("Trying next model...")

        except Exception as e:
            last_error = e
            print(f"Model {model} failed with unexpected error: {e}")
            if attempt < len(FALLBACK_MODELS) - 1:
                print("Trying next model...")

    print(f"Coaching analysis failed after {len(FALLBACK_MODELS)} models. Last error: {last_error}")
    return None
