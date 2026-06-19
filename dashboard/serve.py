import sys
import os
import json
import http.server
import socketserver
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_DIR = Path(__file__).resolve().parent.parent
RESULTS_DIR = BASE_DIR / "data" / "results"
PORT = int(os.environ.get("PORT", "8080"))

# Serve built frontend from dist/ if it exists, else fallback to dashboard/
STATIC_DIR = Path(__file__).resolve().parent / "dist"
if not STATIC_DIR.exists():
    STATIC_DIR = Path(__file__).resolve().parent


class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def do_GET(self):
        path = self.path.rstrip("/") or "/"
        if path.startswith("/api/"):
            self.handle_api()
        else:
            # For SPA: serve index.html for non-file routes
            if STATIC_DIR.joinpath(path.lstrip("/")).exists():
                super().do_GET()
            else:
                index_path = STATIC_DIR / "index.html"
                if index_path.exists():
                    self.send_response(200)
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                    self.end_headers()
                    with open(index_path, "rb") as f:
                        self.wfile.write(f.read())
                else:
                    self.send_response(404)
                    self.end_headers()

    def handle_api(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        if self.path == "/api/results":
            latest_file = RESULTS_DIR / "latest.json"
            if latest_file.exists():
                with open(latest_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
            else:
                self.wfile.write(json.dumps([]).encode())
        elif self.path == "/api/stats":
            latest_file = RESULTS_DIR / "latest.json"
            if latest_file.exists():
                with open(latest_file, "r", encoding="utf-8") as f:
                    results = json.load(f)
                total = len(results)
                jailbroken = sum(1 for r in results if r.get("verdict") == "JAILBROKEN")
                refused = sum(1 for r in results if r.get("verdict") == "REFUSED")
                errors = sum(1 for r in results if r.get("verdict") in ("NO_RESPONSE", "ERROR", "JUDGE_ERROR", "UNCLEAR"))
                models = sorted(set(r.get("model_display", r.get("model", "")) for r in results))
                stats = {
                    "total": total, "jailbroken": jailbroken, "refused": refused, "errors": errors,
                    "models": models, "jailbroken_pct": round(jailbroken / total * 100, 1) if total > 0 else 0,
                    "refused_pct": round(refused / total * 100, 1) if total > 0 else 0,
                }
                self.wfile.write(json.dumps(stats).encode())
            else:
                self.wfile.write(json.dumps({"total": 0}).encode())
        elif self.path == "/api/backend-status":
            latest_file = RESULTS_DIR / "latest.json"
            connected = latest_file.exists()
            self.wfile.write(json.dumps({"connected": connected}).encode())
        else:
            self.wfile.write(json.dumps({"error": "Not found"}).encode())


def main():
    print(f"Server: http://0.0.0.0:{PORT}")
    with socketserver.TCPServer(("0.0.0.0", PORT), DashboardHandler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    main()