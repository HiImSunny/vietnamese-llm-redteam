"""
Dataset builder for Vietnamese LLM Red-Teaming.
Loads prompts from JSON files and constructs the evaluation dataset.
"""
import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from .categories import HARM_CATEGORIES, VN_SPECIFIC_CATEGORIES, ALL_CATEGORIES


BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "prompts"


def load_prompts(file_path: str) -> List[Dict]:
    """Load prompts from a JSON file."""
    full_path = BASE_DIR / file_path
    if not full_path.exists():
        print(f"[WARN] Prompt file not found: {full_path}")
        return []
    with open(full_path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_dataset(prompt_files: Optional[List[str]] = None) -> List[Dict]:
    """Build full dataset from all prompt files."""
    if prompt_files is None:
        prompt_files = [
            "data/prompts/jbb_translated_vi.json",
            "data/prompts/vn_specific.json",
            "data/prompts/benign_vi.json",
        ]
    all_prompts = []
    for f in prompt_files:
        prompts = load_prompts(f)
        all_prompts.extend(prompts)
        print(f"[INFO] Loaded {len(prompts)} prompts from {f}")
    print(f"[INFO] Total prompts: {len(all_prompts)}")
    return all_prompts


def save_dataset(prompts: List[Dict], file_path: str):
    """Save prompts to JSON file."""
    full_path = BASE_DIR / file_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        json.dump(prompts, f, ensure_ascii=False, indent=2)
    print(f"[INFO] Saved {len(prompts)} prompts to {full_path}")


def get_category_stats(prompts: List[Dict]) -> Dict:
    """Get statistics about categories in the dataset."""
    stats = {}
    for p in prompts:
        cat = p.get("category", "unknown")
        lang = p.get("language", "vi")
        key = f"{cat}_{lang}"
        stats[key] = stats.get(key, 0) + 1
    return stats
