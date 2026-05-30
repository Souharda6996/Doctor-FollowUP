import psycopg2
import os
import urllib.parse
import time

def run_migration():
    # Use the connection string pattern for Supabase
    password = urllib.parse.quote("Souharda@2004")
    # Trying the direct host first, then pooler if needed
    host = "db.qsaewctggiezyvilowzb.supabase.co"
    conn_str = f"postgresql://postgres:{password}@{host}:5432/postgres"
    
    print(f"Connecting to Supabase at {host}...")
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(conn_str, connect_timeout=10)
            conn.autocommit = True
            cur = conn.cursor()
            
            print("Reading schema.sql...")
            with open('database/schema.sql', 'r') as f:
                sql = f.read()
                
            print("Executing schema...")
            # Split by ';' to handle potential large blocks, but raw execute is usually fine
            cur.execute(sql)
            
            print("✅ Database migration successful!")
            cur.close()
            conn.close()
            return True
        except Exception as e:
            print(f"⚠️ Attempt {attempt + 1} failed: {str(e)}")
            if "translate host name" in str(e):
                print("Trying alternative host: aws-0-ap-south-1.pooler.supabase.com")
                host = "aws-0-ap-south-1.pooler.supabase.com"
                conn_str = f"postgresql://postgres:{password}@{host}:5432/postgres"
            time.sleep(2)
    
    print("❌ All migration attempts failed.")
    return False

if __name__ == "__main__":
    run_migration()
