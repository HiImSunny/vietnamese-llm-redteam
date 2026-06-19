"""
Direct attack: send Vietnamese adversarial prompt directly to the LLM.
"""
from typing import Dict, List, Optional
from ..models.wrapper import LLMWrapper


class DirectAttack:
    """Single-turn direct Vietnamese prompt attack."""

    def __init__(self, model: LLMWrapper):
        self.model = model
        self.name = "direct"

    def run(self, prompt: Dict) -> Dict:
        """Run a single direct attack."""
        user_msg = {"role": "user", "content": prompt["prompt"]}
        response = self.model.query([user_msg])

        return {
            "prompt_id": prompt.get("id", ""),
            "prompt_text": prompt["prompt"],
            "category": prompt.get("category", "unknown"),
            "language": prompt.get("language", "vi"),
            "attack_type": self.name,
            "model": self.model.model_id,
            "response": response,
            "attack_messages": [user_msg],
        }
