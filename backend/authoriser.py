import requests

def refresh_access_token(client_id, client_secret, refresh_token):
    """
    Asks Strava for a brand new Access Token using the Refresh Token.
    """
    auth_url = "https://www.strava.com/oauth/token"
    
    auth_payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
        "f": "json"
    }
    
    print("Requesting a new Access Token from Strava...")
    response = requests.post(auth_url, data=auth_payload)
    
    if response.status_code == 200:
        new_token_data = response.json()
        print("Successfully generated a new Access Token!")
        return new_token_data.get("access_token")
    else:
        print(f"Failed to get new token. Status Code: {response.status_code}")
        print(response.text)
        return None