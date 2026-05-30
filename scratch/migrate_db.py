import psycopg2
import os
import urllib.parse

def run_migration():
    password = urllib.parse.quote("Souharda@2004")
    conn_str = f"postgresql://postgres:{password}@db.qsaewctggiezyvilowzb.supabase.co:5432/postgres"
    print("Connecting to Supabase...")
    
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Reading schema.sql...")
        with open('database/schema.sql', 'r') as f:
            sql = f.read()
            
        print("Executing schema...")
        cur.execute(sql)
        
        print("Database migration successful!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration failed: {str(e)}")

if __name__ == "__main__":
    run_migration()
