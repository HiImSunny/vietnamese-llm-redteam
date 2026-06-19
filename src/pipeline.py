"""
Pipeline orchestrator: ties together models, attacks, judge, and results.
"""
import json
import time
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

from .dataset.builder import build_dataset
from .models.wrapper import LLMWrapper, get_model_list
from .attacks.direct import DirectAttack
from .attacks.multiturn import MultiTurnAttack
from .attacks.crosslingual import CrossLingualAttack
from .attacks.roleplay import RolePlayAttack
from .judge.llm_judge import LLMJudge

BASE_DIR = Path(__file__).resolve().parent.parent


class RedTeamingPipeline:
    """Orchestrates the full red-teaming pipeline."""

    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.models = self._init_models()
        self.attacks = self._init_attacks()
        self.judge = LLMJudge()
        self.results = []

    def _init_models(self) -> List[Dict]:
        return get_model_list(enabled_only=True)

    def _init_attacks(self) -> Dict:
        attacks_conf = self.config.get("attacks", {})
        return {
            "direct": attacks_conf.get("direct", {}).get("enabled", True),
            "multiturn": attacks_conf.get("multiturn", {}).get("enabled", True),
            "crosslingual": attacks_conf.get("crosslingual", {}).get("enabled", True),
            "roleplay": attacks_conf.get("roleplay", {}).get("enabled", True),
        }

    def _get_attack_instances(
        self, model_wrapper: LLMWrapper
    ) -> List:
        """Create attack instances for a given model wrapper."""
        instances = []
        if self.attacks.get("direct"):
            instances.append(DirectAttack(model_wrapper))
        if self.attacks.get("multiturn"):
            instances.append(MultiTurnAttack(model_wrapper))
        if self.attacks.get("crosslingual"):
            instances.append(CrossLingualAttack(model_wrapper))
        if self.attacks.get("roleplay"):
            for persona in ["researcher", "teacher", "journalist", "concerned_citizen"]:
                instances.append(RolePlayAttack(model_wrapper, persona=persona))
        return instances

    def run(
        self,
        prompt_files: Optional[List[str]] = None,
        model_names: Optional[List[str]] = None,
        max_prompts: Optional[int] = None,
    ) -> List[Dict]:
        """Run full red-teaming pipeline."""
        prompts = build_dataset(prompt_files)
        if max_prompts:
            prompts = prompts[:max_prompts]

        enabled_models = self.models
        if model_names:
            enabled_models = [
                m for m in enabled_models if m["id"] in model_names
            ]

        print(f"\\n{'='*60}")
        print(f"Vietnamese LLM Red-Teaming Pipeline")
        print(f"Models: {len(enabled_models)}")
        print(f"Prompts: {len(prompts)}")
        print(f"{'='*60}\\n")

        total = len(enabled_models) * len(prompts) * sum(1 for v in self.attacks.values() if v)
        completed = 0

        for model_cfg in enabled_models:
            print(f"\\n--- Model: {model_cfg['display']} ---")
            wrapper = LLMWrapper(
                model_cfg["id"],
                model_cfg["provider"],
            )
            attacks = self._get_attack_instances(wrapper)

            for prompt in prompts:
                for attack in attacks:
                    try:
                        result = attack.run(prompt)
                        result["model_display"] = model_cfg["display"]
                        result["provider"] = model_cfg["provider"]
                        verdict = self.judge.evaluate(result.get("response"))
                        result["verdict"] = verdict
                        self.results.append(result)
                    except Exception as e:
                        print(f"  [ERROR] {model_cfg['id']}/{attack.name}: {e}")
                        self.results.append({
                            "prompt_id": prompt.get("id", ""),
                            "model": model_cfg["id"],
                            "model_display": model_cfg["display"],
                            "attack_type": attack.name,
                            "error": str(e),
                            "verdict": "ERROR",
                        })

                    completed += 1
                    if completed % 10 == 0:
                        print(f"  Progress: {completed}/{total}")

                    time.sleep(0.5)  # rate limiting

        self._save_results()
        return self.results

    def _save_results(self):
        """Save results to JSON."""
        results_dir = BASE_DIR / "data" / "results"
        results_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = results_dir / f"results_{timestamp}.json"
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        print(f"\\n[INFO] Results saved to {filepath}")

        # Also save as latest.json for dashboard
        latest_path = results_dir / "latest.json"
        with open(latest_path, "w", encoding="utf-8") as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        print(f"[INFO] Latest results saved to {latest_path}")
