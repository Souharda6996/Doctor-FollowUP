import psycopg2
import urllib.parse

def migrate():
    # IPv6 fix: Use the Pooler which supports IPv4
    ref = "qsaewctggiezyvilowzb"
    password = urllib.parse.quote("Souharda@2004")
    user = f"postgres.{ref}"
    host = "aws-0-ap-south-1.pooler.supabase.com"
    port = 6543 # Transaction Pooler
    
    conn_str = f"postgresql://{user}:{password}@{host}:{port}/postgres?sslmode=require"
    
    print(f"Connecting to Supabase Pooler (IPv4) at {host}...")
    
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Reading schema.sql...")
        with open('database/schema.sql', 'r') as f:
            sql = f.read()
            
        print("Executing schema...")
        cur.execute(sql)
        
        print("DATABASE SCHEMA DEPLOYED SUCCESSFULLY!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"MIGRATION FAILED: {str(e)}")

if __name__ == "__main__":
    migrate()
