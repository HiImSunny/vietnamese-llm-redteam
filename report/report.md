# Vietnamese LLM Red-Teaming: Jailbreaking Multilingual Guardrails in Low-Resource Languages

**Track 3: Asia — Technical AI Safety Sub-track**
**Global South AI Safety Hackathon 2026 | June 19–21**

**Team:** [Your Team Name]
**Location:** Vietnam

---

## Abstract

Safety alignment of large language models (LLMs) is predominantly trained and evaluated on English data. When receiving input in low-resource languages like Vietnamese, safety guardrails often weaken or fail entirely. This study systematically red-teams 8 major LLMs — GPT-4o, GPT-4o-mini, Claude Sonnet 4, Claude Haiku 3.5, Gemini 2.5 Pro, Gemini 2.5 Flash, DeepSeek V3, and DeepSeek R1 — using 100+ Vietnamese adversarial prompts. We measure the "safety gap" between English and Vietnamese inputs and release the first public Vietnamese adversarial prompt dataset.

---

## 1. Introduction

AI safety research is concentrated in a handful of countries and languages. As LLMs are deployed globally, safety guardrails trained primarily on English data may not transfer effectively to low-resource languages. Recent work (May 2026) demonstrated multilingual jailbreaking success in African languages (Afrikaans, Kiswahili, isiXhosa, isiZulu), but Vietnamese remained unexplored.

This gap is particularly consequential for Vietnam, which enacted the first binding AI legislation in Southeast Asia in March 2026. Vietnamese companies and government agencies deploying LLMs require robust safety testing tools tailored to the local language and context.

---

## 2. Methodology

### 2.1 Dataset Construction

We constructed a Vietnamese adversarial prompt dataset comprising three sources:

1. **JailbreakBench Translation (50 prompts):** 50 harmful behaviors from JailbreakBench (NeurIPS 2024) translated to Vietnamese, covering 10 harm categories: violent crimes, non-violent crimes, hate/discrimination, self-harm, illegal drugs, weapons, child abuse, privacy violations, misinformation, and sex crimes.

2. **Vietnam-Specific Prompts (30+ prompts):** Culturally adapted prompts targeting two categories:
   - **Scam/Phishing (15 prompts):** Simulating common Vietnamese scam patterns including fake bank alerts (lua dao ngan hang), impersonation calls (gia danh cong an), online marketplace fraud, and multi-level marketing schemes.
   - **Political Misinformation (15+ prompts):** Testing guardrails against region-relevant political misinformation, election interference, and divisive content.

3. **Benign Controls (20 prompts):** Safe Vietnamese queries for baseline comparison.

### 2.2 Attack Strategies

We employed four attack strategies:

| Attack Type | Description |
|-------------|-------------|
| **Direct** | Single-turn adversarial prompt in Vietnamese |
| **Multi-Turn** | Gradual escalation across 5 conversation turns in Vietnamese |
| **Cross-Lingual** | Begin in English, switch to Vietnamese mid-conversation (turn 3) |
| **Role-Play** | Assume a persona (teacher, researcher, journalist, concerned citizen) |

### 2.3 Evaluation

We used LLM-as-Judge (GPT-4o-mini, temperature=0.0) to classify each model response as either "JAILBROKEN" (response provides harmful content) or "REFUSED" (response declines to comply).

---

## 3. Results

### 3.1 Overall Jailbreak Rates

| Metric | Value |
|--------|-------|
| Total Tests | [Results] |
| Overall Jailbreak Rate | [%] |
| Vietnamese Prompts Jailbroken | [%] |
| English Prompts Jailbroken (baseline) | [%] |
| Safety Gap | [percentage points] |

### 3.2 Per-Model Results

| Model | Jailbreak Rate | Refusal Rate |
|-------|---------------|-------------|
| GPT-4o | [%] | [%] |
| GPT-4o-mini | [%] | [%] |
| Claude Sonnet 4 | [%] | [%] |
| Claude Haiku 3.5 | [%] | [%] |
| Gemini 2.5 Pro | [%] | [%] |
| Gemini 2.5 Flash | [%] | [%] |
| DeepSeek V3 | [%] | [%] |
| DeepSeek R1 | [%] | [%] |

### 3.3 Results by Attack Type

| Attack Type | Jailbreak Rate |
|-------------|---------------|
| Direct | [%] |
| Multi-Turn | [%] |
| Cross-Lingual | [%] |
| Role-Play | [%] |

### 3.4 Vietnam-Specific Findings

[Analysis of scam/phishing and political misinformation prompt results]

---

## 4. Analysis

### 4.1 Language Safety Gap

[Discussion of disparity between English and Vietnamese guardrail effectiveness]

### 4.2 Pattern Analysis

[Common failure patterns: which prompt types most commonly bypass guardrails]

### 4.3 Model Comparison

[Which models are most/least robust to Vietnamese attacks]

---

## 5. Policy Recommendations

Based on our findings, we recommend:

1. **Vietnamese-specific safety training:** LLM providers should incorporate Vietnamese adversarial examples into safety fine-tuning datasets.
2. **Regulatory requirements:** Vietnam's AI law enforcement should mandate safety evaluation in Vietnamese for all LLMs deployed in country.
3. **Public benchmark:** Establish a public Vietnamese safety benchmark to track model improvement over time.
4. **Cross-lingual testing protocol:** Safety evaluation frameworks should include cross-lingual attack vectors as standard test cases.

---

## 6. Conclusion

This study demonstrates a significant safety gap in LLM guardrails for Vietnamese, a low-resource language spoken by over 85 million people. We release the first public Vietnamese adversarial prompt dataset and provide actionable recommendations for improving multilingual AI safety. Our methodology is transferable to other Southeast Asian languages (Thai, Bahasa, Tagalog).

---

## 7. Dataset and Code

- **Dataset:** [HuggingFace link]
- **Code:** [GitHub link]
- **Dashboard:** [Deployment link]

---

## References

1. JailbreakBench: An Open Robustness Benchmark for Jailbreaking Large Language Models. NeurIPS 2024.
2. Multilingual Jailbreaking of LLMs Using Low-Resource Languages. May 2026.
3. Vietnam AI Law (Law on Artificial Intelligence). Effective March 2026.
4. StrongREJECT for Evaluating Jailbreak Susceptibility. arXiv:2402.10260.
5. HarmBench: A Standardized Evaluation Framework for Automated Red Teaming.
