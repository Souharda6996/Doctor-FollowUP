import psycopg2
import urllib.parse

def migrate():
    ref = "qsaewctggiezyvilowzb"
    password = urllib.parse.quote("Souharda@2004")
    user = f"postgres.{ref}"
    # Session Pooler is usually on 5432, Transaction Pooler on 6543
    host = "aws-0-ap-south-1.pooler.supabase.com"
    
    conn_str = f"postgresql://{user}:{password}@{host}:5432/postgres?sslmode=require"
    
    print(f"Connecting to Supabase Session Pooler (5432) as {user}...")
    
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
