"""
Export pipeline results to CSV and HuggingFace format.
Usage:
  python scripts/export_results.py
  python scripts/export_results.py --push-to-hub your-username/vietnamese-llm-redteam
"""
import sys
import os
import json
import csv
import argparse
from pathlib import Path
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_DIR = Path(__file__).resolve().parent.parent
RESULTS_DIR = BASE_DIR / "data" / "results"


def load_latest_results() -> list:
    latest = RESULTS_DIR / "latest.json"
    if not latest.exists():
        print(f"[ERROR] No results found at {latest}")
        print("Please run the pipeline first: python scripts/run_redteam.py")
        sys.exit(1)
    with open(latest, "r", encoding="utf-8") as f:
        return json.load(f)


def export_csv(results: list, output_path: Path):
    fieldnames = [
        "prompt_id", "model", "model_display", "attack_type",
        "category", "language", "verdict", "prompt_text", "response"
    ]
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)
    print(f"[INFO] CSV exported to {output_path}")


def export_huggingface(results: list, output_dir: Path):
    """Export results in HuggingFace dataset format."""
    output_dir.mkdir(parents=True, exist_ok=True)

    hf_data = []
    for r in results:
        hf_data.append({
            "prompt_id": r.get("prompt_id", ""),
            "prompt_text": r.get("prompt_text", ""),
            "category": r.get("category", ""),
            "language": r.get("language", ""),
            "model": r.get("model", ""),
            "model_display": r.get("model_display", ""),
            "attack_type": r.get("attack_type", ""),
            "response": r.get("response", ""),
            "verdict": r.get("verdict", ""),
        })

    with open(output_dir / "dataset.json", "w", encoding="utf-8") as f:
        json.dump(hf_data, f, ensure_ascii=False, indent=2)

    # Create README for HuggingFace
    readme = f"""---
language:
- vi
license: mit
tags:
- vietnamese
- red-teaming
- jailbreak
- llm-safety
- ai-safety
datasets:
- JailbreakBench/JBB-Behaviors
size_categories:
- n<1K
---
# Vietnamese LLM Red-Teaming Dataset

First public Vietnamese adversarial prompt dataset for LLM safety evaluation.

## Description
This dataset contains {len(hf_data)} test results evaluating major LLMs against
Vietnamese adversarial prompts translated from JailbreakBench and Vietnam-specific
harm categories (scams, political misinformation).

## Categories
- **JailbreakBench Translated**: 50 harmful behaviors translated to Vietnamese
- **Vietnam-Specific**: 30+ prompts targeting scam/phishing and political misinfo in Vietnam
- **Benign Controls**: 20 safe prompts for baseline comparison

## Models Tested
GPT-4o, GPT-4o-mini, Claude Sonnet 4, Claude Haiku 3.5, Gemini 2.5 Pro, Gemini 2.5 Flash, DeepSeek V3, DeepSeek R1

## Usage
`python
from datasets import load_dataset
dataset = load_dataset("your-username/vietnamese-llm-redteam")
`

## Citation
`ibtex
@misc{vietnamese-llm-redteam-2026,
  title={Vietnamese LLM Red-Teaming: Jailbreaking Multilingual Guardrails in Low-Resource Languages},
  author={\{Your Team Name\}},
  year={2026},
  publisher={HuggingFace}
}
`
"""

    with open(output_dir / "README.md", "w", encoding="utf-8") as f:
        f.write(readme)

    print(f"[INFO] HuggingFace dataset exported to {output_dir}")


def push_to_hub(output_dir: Path, repo_id: str):
    """Push dataset to HuggingFace Hub."""
    try:
        from huggingface_hub import HfApi
        api = HfApi()
        api.create_repo(repo_id=repo_id, repo_type="dataset", exist_ok=True)
        api.upload_folder(
            folder_path=str(output_dir),
            repo_id=repo_id,
            repo_type="dataset",
        )
        print(f"[INFO] Dataset pushed to https://huggingface.co/datasets/{repo_id}")
    except ImportError:
        print("[ERROR] huggingface_hub not installed. Run: pip install huggingface_hub")
    except Exception as e:
        print(f"[ERROR] Failed to push to hub: {e}")


def main():
    parser = argparse.ArgumentParser(description="Export red-teaming results")
    parser.add_argument("--csv", type=str, help="Output CSV file path")
    parser.add_argument("--hf-dir", type=str, help="Output directory for HuggingFace format")
    parser.add_argument("--push-to-hub", type=str, help="HuggingFace repo ID to push dataset")
    args = parser.parse_args()

    results = load_latest_results()
    print(f"[INFO] Loaded {len(results)} results")

    if args.csv:
        export_csv(results, Path(args.csv))
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_path = RESULTS_DIR / f"results_{timestamp}.csv"
        export_csv(results, csv_path)

    if args.hf_dir:
        export_huggingface(results, Path(args.hf_dir))

    if args.push_to_hub:
        hf_dir = Path(args.hf_dir) if args.hf_dir else RESULTS_DIR / "hf_dataset"
        export_huggingface(results, hf_dir)
        push_to_hub(hf_dir, args.push_to_hub)


if __name__ == "__main__":
    main()
