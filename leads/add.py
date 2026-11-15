import os
D=os.path.dirname(os.path.abspath(__file__))
import json,sys,re
recs=json.loads(sys.stdin.read())
ex=set(json.load(open(D+'/exclude.json')))
have={}
try:
  for l in open(D+'/prospects.jsonl'):
    r=json.loads(l); have[r['email'].lower()]=1; have[r['slug']]=1
except FileNotFoundError: pass
out=open(D+'/prospects.jsonl','a'); n=0; new=[]
for r in recs:
  e=r['email'].lower()
  if e in ex or e in have: print('SKIP dup',r['name']); continue
  s=re.sub(r'[^a-z0-9]+','-',r['name'].lower()).strip('-')
  while s in have: s+='-2'
  r['slug']=s; have[s]=1; have[e]=1
  out.write(json.dumps(r)+'\n'); n+=1; new.append(s)
print('added',n,'total',sum(1 for _ in open(D+'/prospects.jsonl')))
print('NEW_SLUGS',' '.join(new))
