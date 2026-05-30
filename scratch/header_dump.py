import requests

url = "https://qsaewctggiezyvilowzb.supabase.co/rest/v1/"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzYWV3Y3RnZ2llenl2aWxvd3piIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg0MDUwMSwiZXhwIjoyMDkxNDE2NTAxfQ.vxMAjS1D77eK0QkLD3-eCICgmKHUyy3I-uKI6ObJTHU",
}

response = requests.get(url, headers=headers)
for k, v in response.headers.items():
    print(f"{k}: {v}")
