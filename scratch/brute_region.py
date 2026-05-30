import psycopg2
import urllib.parse

def try_all_regions():
    regions = [
        "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
        "us-east-1", "us-east-2", "us-west-1", "us-west-2",
        "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3"
    ]
    
    ref = "qsaewctggiezyvilowzb"
    password = urllib.parse.quote("Souharda@2004")
    user = f"postgres.{ref}"
    
    for r in regions:
        host = f"aws-0-{r}.pooler.supabase.com"
        conn_str = f"postgresql://{user}:{password}@{host}:6543/postgres?sslmode=require"
        
        print(f"Checking region: {r}...", end=" ")
        try:
            conn = psycopg2.connect(conn_str, connect_timeout=3)
            print("FOUND!")
            
            with open('database/schema.sql', 'r') as f:
                sql = f.read()
            
            cur = conn.cursor()
            cur.execute(sql)
            conn.commit()
            print("SCHEMA DEPLOYED!")
            conn.close()
            return True
        except Exception as e:
            if "Tenant or user not found" in str(e):
                print("No.")
            else:
                print(f"Error: {str(e)[:50]}")
    
    return False

if __name__ == "__main__":
    try_all_regions()
