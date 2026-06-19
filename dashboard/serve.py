"""
Simple HTTP server to serve the Vietnamese LLM Red-Teaming dashboard.
Usage:
  python dashboard/serve.py
  # Then open http://localhost:8080
"""
import sys
import os
import json
import http.server
import socketserver
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_DIR = Path(__file__).resolve().parent.parent
DASHBOARD_DIR = BASE_DIR / "dashboard"
RESULTS_DIR = BASE_DIR / "data" / "results"
PORT = 8080


class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DASHBOARD_DIR), **kwargs)

    def do_GET(self):
        if self.path == "/api/results" or self.path == "/api/results/":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            latest_file = RESULTS_DIR / "latest.json"
            if latest_file.exists():
                with open(latest_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
            else:
                self.wfile.write(json.dumps([]).encode())
        elif self.path == "/api/stats" or self.path == "/api/stats/":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            latest_file = RESULTS_DIR / "latest.json"
            if latest_file.exists():
                with open(latest_file, "r", encoding="utf-8") as f:
                    results = json.load(f)
                total = len(results)
                jailbroken = sum(1 for r in results if r.get("verdict") == "JAILBROKEN")
                refused = sum(1 for r in results if r.get("verdict") == "REFUSED")
                errors = sum(1 for r in results if r.get("verdict") in ("NO_RESPONSE", "ERROR", "JUDGE_ERROR", "UNCLEAR"))
                models = list(set(r.get("model_display", r.get("model", "")) for r in results))
                models.sort()
                stats = {
                    "total": total,
                    "jailbroken": jailbroken,
                    "refused": refused,
                    "errors": errors,
                    "models": models,
                    "jailbroken_pct": round(jailbroken / total * 100, 1) if total > 0 else 0,
                    "refused_pct": round(refused / total * 100, 1) if total > 0 else 0,
                }
                self.wfile.write(json.dumps(stats).encode())
            else:
                self.wfile.write(json.dumps({"total": 0, "error": "No results yet"}).encode())
        else:
            super().do_GET()


def main():
    print(f"""
    ==============================================
      Vietnamese LLM Red-Teaming Dashboard
    ==============================================
      Open: http://localhost:{PORT}
      API:  http://localhost:{PORT}/api/results
            http://localhost:{PORT}/api/stats
    ==============================================
    Press Ctrl+C to stop.
    """)
    with socketserver.TCPServer(("", PORT), DashboardHandler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    main()
