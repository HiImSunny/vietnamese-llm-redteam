# Vietnamese LLM Red-Teaming

**Track 3: Asia — Technical AI Safety | Global South AI Safety Hackathon 2026**

Systematic red-teaming of major LLMs using Vietnamese adversarial prompts. Measures jailbreak success rate disparity between English and Vietnamese inputs, identifies failure patterns in safety guardrails for low-resource languages.

## Impact

Vietnam's AI law took effect March 2026 — the first binding AI legislation in Southeast Asia. Vietnamese companies deploying LLMs must now test safety. This tool directly serves that need.

## Quick Start

`ash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set up API keys
cp .env.example .env
# Edit .env and fill in your API keys

# 3. Run the pipeline
python scripts/run_redteam.py --models all

# 4. View the dashboard
python dashboard/serve.py
# Open http://localhost:8080
`

### Quick test (10 prompts only)
`ash
python scripts/run_redteam.py --models gpt-4o-mini --max-prompts 10
`

## Project Structure

`
vietnamese-llm-redteam/
├── config/settings.yaml         # Model and attack configuration
├── data/prompts/                # Prompt datasets
│   ├── jbb_translated_vi.json   # 50 JailbreakBench harmful behaviors -> Vietnamese
│   ├── vn_specific.json         # 30+ VN-specific prompts (scam, political)
│   └── benign_vi.json           # 20 benign controls
├── src/                         # Core pipeline
│   ├── dataset/                 # Dataset loading and categories
│   ├── models/                  # LLM wrapper (LiteLLM)
│   ├── attacks/                 # Attack strategies
│   │   ├── direct.py            # Single-turn Vietnamese prompts
│   │   ├── multiturn.py         # Gradual escalation in Vietnamese
│   │   ├── crosslingual.py      # English -> Vietnamese switch
│   │   └── roleplay.py          # Persona-based attacks
│   └── judge/                   # LLM-as-judge evaluation
├── scripts/
│   ├── run_redteam.py           # Main CLI runner
│   └── export_results.py        # Export to CSV / HuggingFace
├── dashboard/                   # Interactive web dashboard
│   ├── index.html               # Frontend HTML
│   └── serve.py                 # Python server
└── requirements.txt
`

## Attack Strategies

| Attack | Description |
|--------|-------------|
| **Direct** | Single-turn Vietnamese adversarial prompt |
| **Multi-Turn** | Gradual escalation across 5 turns in Vietnamese |
| **Cross-Lingual** | Start in English, switch to Vietnamese mid-conversation |
| **Role-Play** | Assume persona (teacher, researcher, journalist, citizen) |

## Dataset

- **50 JailbreakBench behaviors** translated to Vietnamese (10 categories)
- **30+ Vietnam-specific prompts**: scam/phishing patterns, political misinformation
- **20 benign controls** for baseline comparison
- First public Vietnamese adversarial prompt dataset (HuggingFace)

## Models Tested

- OpenAI: GPT-4o, GPT-4o-mini
- Anthropic: Claude Sonnet 4, Claude Haiku 3.5
- Google: Gemini 2.5 Pro, Gemini 2.5 Flash
- DeepSeek: DeepSeek V3, DeepSeek R1

## Export

`ash
# Export to CSV
python scripts/export_results.py --csv results.csv

# Export to HuggingFace format
python scripts/export_results.py --hf-dir ./hf_dataset

# Push to HuggingFace Hub
python scripts/export_results.py --push-to-hub your-username/vietnamese-llm-redteam
`

## License

MIT
