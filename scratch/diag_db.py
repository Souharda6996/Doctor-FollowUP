import socket
import psycopg2
import urllib.parse

def diag():
    hosts = [
        "db.qsaewctggiezyvilowzb.supabase.co",
        "aws-0-ap-south-1.pooler.supabase.com",
        "qsaewctggiezyvilowzb.supabase.co"
    ]
    
    for h in hosts:
        try:
            ip = socket.gethostbyname(h)
            print(f"HOST: {h} -> IP: {ip}")
        except:
            print(f"HOST: {h} -> FAILED TO RESOLVE")

    password = urllib.parse.quote("Souharda@2004")
    # Try Port 6543 (Transaction Pooler) which is often more firewall-friendly
    host = "aws-0-ap-south-1.pooler.supabase.com"
    conn_str = f"postgresql://postgres:{password}@{host}:6543/postgres?sslmode=require"
    
    try:
        print(f"Attempting connection to {host} on port 6543...")
        conn = psycopg2.connect(conn_str)
        print("SUCCESSFULLY CONNECTED!")
        
        with open('database/schema.sql', 'r') as f:
            sql = f.read()
        
        cur = conn.cursor()
        cur.execute(sql)
        conn.commit()
        print("SCHEMA DEPLOYED SUCCESSFULLY!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"CONNECTION FAILED: {str(e)}")

if __name__ == "__main__":
    diag()
