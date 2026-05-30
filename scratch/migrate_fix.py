import psycopg2
import urllib.parse

def migrate():
    # CORRECT REF FROM USER: qsaewctggiezvyilowzb
    password = urllib.parse.quote("Souharda@2004")
    host = "db.qsaewctggiezvyilowzb.supabase.co"
    conn_str = f"postgresql://postgres:{password}@{host}:5432/postgres"
    
    print(f"Connecting to Supabase at {host}...")
    
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
