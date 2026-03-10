import hmac, hashlib, time, uuid, json, os, sys
import urllib.request
import urllib.error

url = "http://localhost:3000/api/internal/discord/demo-submit"
token = os.environ.get("BOT_INTERNAL_TOKEN", "")
secret = os.environ.get("BOT_INTERNAL_SIGNING_SECRET", "")

if not token or not secret:
    sys.exit("BOT_INTERNAL_TOKEN and BOT_INTERNAL_SIGNING_SECRET must be set in the environment.")

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
