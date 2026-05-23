import requests

def send_to_make_webhook(webhook_url, run_data):
    """
    Sends the filtered and formatted run data to a Make.com webhook.
    """
    print(f"Sending '{run_data.get('name')}' to Make.com...")
    
    try:
        response = requests.post(webhook_url, json=run_data) # Send the data as JSON to the webhook URL
        
        # Check the response status code to confirm it was received successfully
        if response.status_code == 200:
            print("Successfully sent to Make.com!")
            return True
        else:
            print(f"Failed to send. Status Code: {response.status_code}")
            print(response.text)
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while trying to contact Make.com: {e}")
        return False