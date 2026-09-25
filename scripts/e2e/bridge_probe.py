"""Minimal ALVIRA Bridge MCP client for the agent-to-AI E2E.

Usage: python3 scripts/e2e/bridge_probe.py <run-dir> <run-id>
It writes <run-dir>/evidence/bridge/authorize_url.txt, then waits (up to 15 min)
for the consent callback on 127.0.0.1:$ALVIRA_E2E_PROBE_PORT. Open that URL in the
signed-in test browser; approving the consent is TK's decision (ask first).

Discovery -> DCR -> PKCE authorize (consent in the browser) -> token -> MCP
initialize / tools/list / tools/call get_alvira_context. Standard library only.
Access tokens stay in memory: they are never printed, logged, or written.
"""
import base64, hashlib, http.server, json, os, secrets, sys, time, urllib.parse, urllib.request, uuid

BASE = os.environ.get("ALVIRA_E2E_BASE", "https://alvira-agent-e2e.vercel.app").rstrip("/")
PORT = int(os.environ.get("ALVIRA_E2E_PROBE_PORT", "53682"))
REDIRECT = f"http://127.0.0.1:{PORT}/callback"
if len(sys.argv) != 3:
    sys.exit("usage: bridge_probe.py <run-dir> <run-id>")
OUT = os.path.join(sys.argv[1], "evidence", "bridge")
RUN_ID = sys.argv[2]
if "alviratech.vercel.app" in BASE:
    sys.exit("refusing to probe production; point ALVIRA_E2E_BASE at the E2E preview")
os.makedirs(OUT, exist_ok=True)
log = []


def now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def call(method, url, body=None, headers=None, form=False):
    headers = dict(headers or {})
    data = None
    if body is not None:
        if form:
            data = urllib.parse.urlencode(body).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    started = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            status, rh, raw = r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        status, rh, raw = e.code, dict(e.headers), e.read()
    entry = {
        "at": now(), "method": method, "url": url.split("?")[0], "status": status,
        "ms": round((time.time() - started) * 1000),
        "vercel_request_id": rh.get("x-vercel-id") or rh.get("X-Vercel-Id"),
        "www_authenticate": rh.get("www-authenticate") or rh.get("WWW-Authenticate"),
        "sent_bearer": "Authorization" in headers,
    }
    log.append(entry)
    try:
        return status, json.loads(raw or b"null")
    except ValueError:
        return status, raw.decode(errors="replace")[:500]


def save(name, obj):
    with open(f"{OUT}/{name}", "w") as f:
        json.dump(obj, f, indent=2)


# 1. Discovery and the unauthenticated MCP challenge
_, as_meta = call("GET", f"{BASE}/.well-known/oauth-authorization-server")
_, pr_meta = call("GET", f"{BASE}/.well-known/oauth-protected-resource/api/bridge/mcp")
call("POST", f"{BASE}/api/bridge/mcp", {"jsonrpc": "2.0", "id": 0, "method": "initialize", "params": {}})
save("discovery.json", {"authorization_server": as_meta, "protected_resource": pr_meta})

# 2. Dynamic client registration (public client, PKCE)
_, client = call("POST", as_meta.get("registration_endpoint", f"{BASE}/api/bridge/register"), {
    "client_name": "ALVIRA E2E Bridge probe (Claude Code agent)",
    "redirect_uris": [REDIRECT], "grant_types": ["authorization_code"],
    "response_types": ["code"], "token_endpoint_auth_method": "none", "application_type": "native",
})
client_id = client["client_id"]
save("client.json", {k: v for k, v in client.items() if "secret" not in k})

# 3. PKCE authorize URL; consent happens in the signed-in browser
verifier = secrets.token_urlsafe(64)
challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
state = secrets.token_urlsafe(16)
auth_url = as_meta["authorization_endpoint"] + "?" + urllib.parse.urlencode({
    "response_type": "code", "client_id": client_id, "redirect_uri": REDIRECT,
    "code_challenge": challenge, "code_challenge_method": "S256", "state": state,
    "scope": "context:read profile:read", "resource": pr_meta.get("resource", f"{BASE}/api/bridge/mcp"),
})
with open(f"{OUT}/authorize_url.txt", "w") as f:
    f.write(auth_url + "\n")
print("AUTHORIZE_URL_WRITTEN", flush=True)

got = {}


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        got.update({k: v[0] for k, v in q.items()})
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(b"<h1>ALVIRA Bridge authorized</h1><p>The E2E probe received the authorization. You can close this tab.</p>")

    def log_message(self, *a):
        pass


srv = http.server.HTTPServer(("127.0.0.1", PORT), Handler)
srv.timeout = 900
srv.handle_request()
if got.get("state") != state or "code" not in got:
    save("log.json", log)
    sys.exit(f"authorization failed: {got.get('error', 'no code / state mismatch')}")
log.append({"at": now(), "event": "authorization_code_received", "state_matched": True})

# 4. Token exchange (token held in memory only)
_, tok = call("POST", as_meta["token_endpoint"], {
    "grant_type": "authorization_code", "code": got["code"], "redirect_uri": REDIRECT,
    "client_id": client_id, "code_verifier": verifier,
}, form=True)
access = tok["access_token"]
save("token_meta.json", {k: v for k, v in tok.items() if "token" not in k or k == "token_type"})

# 5. MCP session
H = {"Authorization": f"Bearer {access}", "Accept": "application/json, text/event-stream"}
mcp = pr_meta.get("resource", f"{BASE}/api/bridge/mcp")
rid = str(uuid.uuid4())
_, init = call("POST", mcp, {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
    "protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "alvira-e2e-probe", "version": RUN_ID}}}, H)
_, tools = call("POST", mcp, {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}, H)
_, profiles = call("POST", mcp, {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "list_alvira_profiles", "arguments": {}}}, H)
_, context = call("POST", mcp, {"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "get_alvira_context", "arguments": {}}}, H)
save("mcp_initialize.json", init)
save("mcp_tools_list.json", tools)
save("mcp_list_profiles.json", profiles)
save("mcp_get_alvira_context.json", context)
save("log.json", {"run_id": RUN_ID, "probe_request_id": rid, "client_id": client_id, "requests": log})
print("BRIDGE_DONE", flush=True)
