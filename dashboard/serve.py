import sys
import os
import json
import http.server
import socketserver
import threading
from pathlib import Path

# Add project root to path
_project_root = str(Path(__file__).resolve().parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

BASE_DIR = Path(__file__).resolve().parent.parent
RESULTS_DIR = BASE_DIR / "data" / "results"
PORT = int(os.environ.get("PORT", "8080"))

STATIC_DIR = Path(__file__).resolve().parent / "dist"
if not STATIC_DIR.exists():
    STATIC_DIR = Path(__file__).resolve().parent

# Available models from config
_MODELS_CACHE = None

def _get_models():
    global _MODELS_CACHE
    if _MODELS_CACHE is None:
        try:
            import yaml
            cfg_path = BASE_DIR / "config" / "settings.yaml"
            with open(cfg_path, encoding="utf-8") as f:
                cfg = yaml.safe_load(f)
            models = []
            for provider, model_list in cfg.get("models", {}).items():
                for m in model_list:
                    if m.get("enabled", True):
                        models.append({
                            "id": m["id"],
                            "display": m.get("display", m["id"]),
                            "provider": provider,
                        })
            _MODELS_CACHE = models
        except Exception:
            _MODELS_CACHE = [
                {"id": "gpt-4o-mini", "display": "GPT-4o-mini", "provider": "openai"},
                {"id": "openai/deepseek-chat", "display": "DeepSeek V3", "provider": "openai"},
            ]
    return _MODELS_CACHE


class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def do_GET(self):
        path = self.path.rstrip("/") or "/"
        if path.startswith("/api/"):
            self.handle_api()
        elif STATIC_DIR.joinpath(path.lstrip("/")).exists():
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

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        try:
            data = json.loads(body.decode("utf-8")) if body else {}
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON"})
            return

        path = self.path.rstrip("/")
        if path == "/api/run":
            self._handle_run(data)
        else:
            self._send_json(404, {"error": "Not found"})

    def _send_json(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def handle_api(self):
        path = self.path.rstrip("/")
        if path == "/api/results":
            latest_file = RESULTS_DIR / "latest.json"
            if latest_file.exists():
                with open(latest_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self._send_json(200, data)
            else:
                self._send_json(200, [])
        elif path == "/api/stats":
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
                    "models": models,
                    "jailbroken_pct": round(jailbroken / total * 100, 1) if total > 0 else 0,
                    "refused_pct": round(refused / total * 100, 1) if total > 0 else 0,
                }
                self._send_json(200, stats)
            else:
                self._send_json(200, {"total": 0})
        elif path == "/api/backend-status":
            self._send_json(200, {"connected": True})
        elif path == "/api/models":
            self._send_json(200, _get_models())
        else:
            self._send_json(404, {"error": "Not found"})

    def _handle_run(self, data):
        api_url = data.get("api_url", "").strip()
        api_key = data.get("api_key", "").strip()
        model = data.get("model", "").strip()
        attack_types = data.get("attack_types", ["direct"])
        max_prompts = int(data.get("max_prompts", 5))

        if not api_key:
            self._send_json(400, {"error": "API key is required"})
            return
        if not model:
            self._send_json(400, {"error": "Model is required"})
            return

        def run_pipeline():
            os.environ["AIML_API_KEY"] = api_key
            if api_url:
                os.environ["AIML_API_BASE"] = api_url

            try:
                from src.pipeline import RedTeamingPipeline
                config = {
                    "attacks": {
                        "direct": {"enabled": "direct" in attack_types},
                        "multiturn": {"enabled": "multiturn" in attack_types},
                        "crosslingual": {"enabled": "crosslingual" in attack_types},
                        "roleplay": {"enabled": "roleplay" in attack_types},
                    }
                }
                pipeline = RedTeamingPipeline(config)
                results = pipeline.run(model_names=[model], max_prompts=max_prompts)

                # results already saved by pipeline._save_results()
                latest_path = RESULTS_DIR / "latest.json"
                if latest_path.exists():
                    with open(latest_path, encoding="utf-8") as f:
                        final = json.load(f)
                else:
                    final = results

                self._send_json(200, {
                    "status": "complete",
                    "total": len(final),
                    "jailbroken": sum(1 for r in final if r.get("verdict") == "JAILBROKEN"),
                    "refused": sum(1 for r in final if r.get("verdict") == "REFUSED"),
                    "results": final,
                })
            except Exception as e:
                import traceback
                traceback.print_exc()
                self._send_json(500, {"error": str(e)})

        run_pipeline()


def main():
    print(f"Server: http://0.0.0.0:{PORT}")
    with socketserver.TCPServer(("0.0.0.0", PORT), DashboardHandler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    main()