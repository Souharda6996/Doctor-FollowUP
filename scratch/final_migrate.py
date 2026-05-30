import psycopg2
import urllib.parse

def migrate():
    password = urllib.parse.quote("Souharda@2004")
    # For Supabase Transaction Pooler (6543), username must be postgres.project_ref
    user = "postgres.qsaewctggiezyvilowzb"
    host = "aws-0-ap-south-1.pooler.supabase.com"
    conn_str = f"postgresql://{user}:{password}@{host}:6543/postgres?sslmode=require"
    
    print(f"Connecting to Supabase Pooler as {user}...")
    
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Reading schema.sql...")
        with open('database/schema.sql', 'r') as f:
            sql = f.read()
            
        print("Executing schema (this may take 30-60 seconds)...")
        cur.execute(sql)
        
        print("✅ DATABASE SCHEMA DEPLOYED SUCCESSFULLY!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ MIGRATION FAILED: {str(e)}")

if __name__ == "__main__":
    migrate()
