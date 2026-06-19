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

p = build_dataset()[:4]
j = LLMJudge()
r = []
t0 = time.time()

for mid, md in [('gpt-4o-mini','GPT-4o-mini'),('openai/deepseek-chat','DeepSeek V3')]:
    w = LLMWrapper(mid, 'openai')
    for a in [DirectAttack(w), CrossLingualAttack(w), RolePlayAttack(w, persona='researcher')]:
        for pr in p:
            try:
                x = a.run(pr)
                x['model_display'] = md
                x['provider'] = 'openai'
                x['verdict'] = j.evaluate(x.get('response'))
                r.append(x)
            except Exception as e:
                r.append({'prompt_id':pr['id'],'model_display':md,'attack_type':a.name,'verdict':'ERROR','error':str(e)})
            time.sleep(0.3)

with open('data/results/latest.json','w',encoding='utf-8') as f:
    json.dump(r, f, ensure_ascii=False, indent=2)

jb = sum(1 for x in r if x.get('verdict')=='JAILBROKEN')
rf = sum(1 for x in r if x.get('verdict')=='REFUSED')
print(f'Done: {len(r)} tests, {jb} jailbroken, {rf} refused, {time.time()-t0:.0f}s')