import requests

def send_to_make_webhook(webhook_url, run_data):
    """
    Sends the filtered and formatted run data to a Make.com webhook.
    """
    print(f"Sending '{run_data.get('run_name')}' to Make.com...")
    
    try:
        response = requests.post(webhook_url, json=run_data)
        response.raise_for_status()
        print("Successfully sent to Make.com!")
        return True
            
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while trying to contact Make.com: {e}")
        return False