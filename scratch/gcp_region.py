import psycopg2
import urllib.parse

def try_gcp_regions():
    regions = [
        "us-east4", "us-central1", "us-west1", "europe-west3", "europe-west1", "asia-southeast1", "asia-northeast1"
    ]
    
    ref = "qsaewctggiezyvilowzb"
    password = urllib.parse.quote("Souharda@2004")
    user = f"postgres.{ref}"
    
    for r in regions:
        host = f"gcp-0-{r}.pooler.supabase.com"
        conn_str = f"postgresql://{user}:{password}@{host}:6543/postgres?sslmode=require"
        
        print(f"Checking GCP region: {r}...", end=" ")
        try:
            conn = psycopg2.connect(conn_str, connect_timeout=3)
            print("FOUND!")
            return True
        except Exception as e:
            if "Tenant or user not found" in str(e):
                print("No.")
            else:
                print(f"Error: {str(e)[:50]}")
    
    return False

if __name__ == "__main__":
    try_gcp_regions()
