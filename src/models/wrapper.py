"""
Unified LLM wrapper using LiteLLM.
Handles API calls to all supported providers.
"""
import os
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_PATH = BASE_DIR / "config" / "settings.yaml"


def _load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


CONFIG = _load_config()


def get_model_list(enabled_only: bool = True) -> List[Dict]:
    """Get list of configured models."""
    models = []
    for provider, model_list in CONFIG["models"].items():
        for m in model_list:
            if enabled_only and not m.get("enabled", True):
                continue
            models.append(m)
    return models


class LLMWrapper:
    """Unified wrapper for LLM API calls using LiteLLM."""

    def __init__(self, model_id: str, provider: str, **kwargs):
        self.model_id = model_id
        self.provider = provider
        self.temperature = kwargs.get("temperature", 0.7)
        self.max_tokens = kwargs.get("max_tokens", 1024)

    def _check_api_key(self) -> bool:
        """Check if API key for this provider exists."""
        if os.getenv("AIML_API_KEY"):
            return True
        key_map = {
            "openai": "OPENAI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "google": "GEMINI_API_KEY",
            "deepseek": "DEEPSEEK_API_KEY",
            "togetherai": "TOGETHER_API_KEY",
        }
        env_key = key_map.get(self.provider, "")
        if env_key and not os.getenv(env_key):
            return False
        return True

    def query(self, messages: List[Dict], **kwargs) -> Optional[str]:
        """Send a query to the LLM and return the response text."""
        if not self._check_api_key():
            print(f"[SKIP] No API key for {self.provider} ({self.model_id})")
            return None

        try:
            import litellm
            kwargs_full = {
                "model": self.model_id,
                "messages": messages,
                "temperature": kwargs.get("temperature", self.temperature),
                "max_tokens": kwargs.get("max_tokens", self.max_tokens),
            }
            aiml_key = os.getenv("AIML_API_KEY")
            if aiml_key:
                kwargs_full["api_key"] = aiml_key
                kwargs_full["api_base"] = os.getenv("AIML_API_BASE", "https://api.aimlapi.com/v1")
            response = litellm.completion(**kwargs_full)
            return response.choices[0].message.content
        except Exception as e:
            print(f"[ERROR] {self.model_id}: {e}")
            return None

    def query_with_history(
        self, messages: List[Dict], **kwargs
    ) -> Optional[str]:
        """Query with full message history (for multi-turn)."""
        return self.query(messages, **kwargs)
