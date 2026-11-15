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
# Charlie's rule: no leads anywhere in Northamptonshire
NTOWNS=['northamptonshire','northampton','kettering','corby','wellingborough','daventry','rushden','raunds','thrapston','oundle','towcester','brackley','desborough','rothwell','burton latimer','irthlingborough','higham ferrers','brixworth','duston','earls barton','finedon','irchester','long buckby','roade','west haddon','weedon','woodford halse','geddington','barton seagrave','cransley','stanion','kings cliffe','bugbrooke','nether heyford','hackleton','silverstone','middleton cheney','kislingbury','pitsford','mawsley','overstone','great houghton']
NPC=re.compile(r'\bNN\d{1,2}\b',re.I)
def in_northants(r):
  t=' '.join(str(r.get(k) or '') for k in ('town','address','name','site','about')).lower()
  return bool(NPC.search(t)) or any(re.search(r'\b'+re.escape(w)+r'\b',t) for w in NTOWNS)
out=open(D+'/prospects.jsonl','a'); n=0; new=[]
for r in recs:
  e=r['email'].lower()
  if e in ex or e in have: print('SKIP dup',r['name']); continue
  if in_northants(r): print('SKIP Northamptonshire',r['name']); continue
  s=re.sub(r'[^a-z0-9]+','-',r['name'].lower()).strip('-')
  while s in have: s+='-2'
  r['slug']=s; have[s]=1; have[e]=1
  out.write(json.dumps(r)+'\n'); n+=1; new.append(s)
print('added',n,'total',sum(1 for _ in open(D+'/prospects.jsonl')))
print('NEW_SLUGS',' '.join(new))
