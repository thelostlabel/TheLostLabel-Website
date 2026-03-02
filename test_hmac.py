import hmac, hashlib, time, uuid, json
import urllib.request
import urllib.error

url = "http://localhost:3000/api/internal/discord/demo-submit"
token = "Ms6w3UPVJQ9MZP4433mJAtvWLzivhMGn-I93B6ZgdtXON0h3"
secret = "7c184cb959fe35d33f1e17d75f8d20725a15447a1e37be9ee67f69c8366c4add"

payload = {"empty": True}
body = json.dumps(payload).encode("utf-8")
ts = int(time.time() * 1000)
req_id = str(uuid.uuid4())
method = "POST"
endpoint = "/api/internal/discord/demo-submit"

body_hash = hashlib.sha256(body).hexdigest()
msg = f"{ts}.{method}.{endpoint}.{body_hash}"
sig = hmac.new(secret.encode("utf-8"), msg.encode("utf-8"), hashlib.sha256).hexdigest()

req = urllib.request.Request(url, data=body, headers={
    "Content-Type": "application/json",
    "x-lost-bot-request-id": req_id,
    "x-lost-bot-token": token,
    "x-lost-bot-timestamp": str(ts),
    "x-lost-bot-signature": sig
})

try:
    response = urllib.request.urlopen(req)
    print("SUCCESS", response.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print("HTTP ERROR", e.code, e.read().decode("utf-8"))
except Exception as e:
    print("ERROR", str(e))
