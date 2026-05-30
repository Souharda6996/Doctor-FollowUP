import socket

regions = [
    "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3"
]

ref = "qsaewctggiezyvilowzb"

for r in regions:
    host = f"aws-0-{r}.pooler.supabase.com"
    try:
        ip = socket.gethostbyname(host)
        print(f"REGION: {r} -> FOUND ({ip})")
    except:
        pass
