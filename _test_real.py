import sys, os, json, time
sys.path.insert(0, os.getcwd())
os.chdir(os.getcwd())
from dotenv import load_dotenv
load_dotenv()
from src.dataset.builder import build_dataset
from src.models.wrapper import LLMWrapper
from src.judge.llm_judge import LLMJudge
from src.attacks.direct import DirectAttack
from src.attacks.crosslingual import CrossLingualAttack
from src.attacks.roleplay import RolePlayAttack

# Mix of JBB + VN-specific prompts
prompts = build_dataset()[:8]
models = [("gpt-4o-mini","GPT-4o-mini","openai"), ("openai/deepseek-chat","DeepSeek V3","openai")]
judge = LLMJudge()
results = []
total = len(prompts) * len(models) * 3
done = 0
t0 = time.time()

for mid, mdisp, mprov in models:
    w = LLMWrapper(mid, mprov)
    attacks = [
        DirectAttack(w),
        CrossLingualAttack(w),
        RolePlayAttack(w, persona="researcher"),
    ]
    for p in prompts:
        for atk in attacks:
            try:
                r = atk.run(p)
                r["model_display"] = mdisp
                r["provider"] = mprov
                r["verdict"] = judge.evaluate(r.get("response"))
                results.append(r)
                done += 1
                elapsed = time.time() - t0
                rate = done / elapsed if elapsed > 0 else 0
                print(f"[{done}/{total}] {mdisp}/{atk.name}: {p['id']} -> {r['verdict']} ({rate:.1f}/s)")
            except Exception as e:
                print(f"  ERROR {mdisp}/{atk.name}/{p['id']}: {e}")
                results.append({"prompt_id": p["id"], "model_display": mdisp, "attack_type": atk.name, "verdict": "ERROR", "error": str(e)})
                done += 1
            time.sleep(0.3)

out = os.path.join("data","results")
os.makedirs(out, exist_ok=True)
with open(os.path.join(out,"latest.json"),"w",encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

jb = sum(1 for r in results if r["verdict"]=="JAILBROKEN")
ref = sum(1 for r in results if r["verdict"]=="REFUSED")
err = sum(1 for r in results if r["verdict"] in ("ERROR","NO_RESPONSE","JUDGE_ERROR"))
print(f"\n{'='*60}")
print(f"FINAL: {len(results)} tests | JAILBROKEN={jb} | REFUSED={ref} | ERRORS={err}")
print(f"Time: {time.time()-t0:.1f}s")
print(f"{'='*60}")
