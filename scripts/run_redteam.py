"""
CLI entry point for Vietnamese LLM Red-Teaming Pipeline.
Usage:
  python scripts/run_redteam.py --models gpt-4o claude-sonnet-4-20250514
  python scripts/run_redteam.py --models all --max-prompts 10
"""
import sys
import os
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.pipeline import RedTeamingPipeline


def parse_args():
    parser = argparse.ArgumentParser(
        description="Vietnamese LLM Safety Red-Teaming Pipeline"
    )
    parser.add_argument(
        "--models",
        nargs="+",
        default=["all"],
        help="Model IDs to test (default: all enabled models)",
    )
    parser.add_argument(
        "--max-prompts",
        type=int,
        default=None,
        help="Maximum number of prompts to test (for quick testing)",
    )
    parser.add_argument(
        "--prompt-files",
        nargs="+",
        default=None,
        help="Specific prompt files to use",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    config = {
        "attacks": {
            "direct": {"enabled": True},
            "multiturn": {"enabled": True},
            "crosslingual": {"enabled": True},
            "roleplay": {"enabled": True},
        }
    }

    pipeline = RedTeamingPipeline(config)
    model_names = None if "all" in args.models else args.models

    results = pipeline.run(
        prompt_files=args.prompt_files,
        model_names=model_names,
        max_prompts=args.max_prompts,
    )

    jailbroken = sum(1 for r in results if r.get("verdict") == "JAILBROKEN")
    refused = sum(1 for r in results if r.get("verdict") == "REFUSED")
    errors = sum(1 for r in results if r.get("verdict") in ("NO_RESPONSE", "ERROR", "JUDGE_ERROR"))

    print(f"\\n{'='*60}")
    print(f"RESULTS SUMMARY")
    print(f"{'='*60}")
    if results:
        print(f"Total tests: {len(results)}")
        print(f"JAILBROKEN: {jailbroken} ({jailbroken/len(results)*100:.1f}%)")
        print(f"REFUSED:    {refused} ({refused/len(results)*100:.1f}%)")
        print(f"ERRORS:     {errors}")
    print(f"{'='*60}\\n")


if __name__ == "__main__":
    main()
