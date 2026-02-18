import requests
import time
import os

API_URL = "http://localhost:8000"

def simulate():
    print("Checking health...")
    try:
        res = requests.get(f"{API_URL}/")
        print(res.json())
        assert res.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return

    print("Fetching countries...")
    res = requests.get(f"{API_URL}/countries")
    countries = res.json()
    print(f"Found {len(countries)} countries.")

    if not countries:
        print("No countries found. Seeding might have failed.")
        return

    arg_id = "ARG"
    print(f"Uploading law for {arg_id}...")

    # Create dummy PDF
    with open("dummy.pdf", "wb") as f:
        f.write(b"%PDF-1.4 dummy content")

    files = {'file': open("dummy.pdf", 'rb')}
    data = {
        'country_id': arg_id,
        'title': 'Test Law 2024',
        'publication_date': '2024-01-01'
    }

    res = requests.post(f"{API_URL}/laws", files=files, data=data)
    print(f"Upload response: {res.json()}")
    assert res.status_code == 200

    print(f"Triggering analysis for {arg_id}...")
    res = requests.post(f"{API_URL}/analyze/{arg_id}")
    print(f"Analysis response: {res.json()}")
    assert res.status_code == 200

    print("Checking dashboard summary...")
    time.sleep(2) # Give a moment for async task (though it won't finish instantly in real scenario)
    res = requests.get(f"{API_URL}/dashboard/summary")
    print(f"Summary: {res.json()}")

    # Clean up
    os.remove("dummy.pdf")
    print("Simulation complete.")

if __name__ == "__main__":
    simulate()
