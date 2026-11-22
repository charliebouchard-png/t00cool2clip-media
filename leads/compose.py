"""Print pitch emails (JSON list) for the given slugs, or all prospects if none given."""
import json, os, sys
D = os.path.dirname(os.path.abspath(__file__))
want = set(sys.argv[1:])
out = []
sys.path.insert(0, D)
from plib import all_prospects
BASE = (open(D + "/preview_base.txt").read().strip() if os.path.exists(D + "/preview_base.txt") else "https://charliebouchard-png.github.io/t00cool2clip-media").rstrip("/")
for r in all_prospects():
    if want and r['slug'] not in want: continue
    short = r.get('short') or r['name']
    body = (f"Hi {r.get('greet','there')},\n\nHad a look at your website and noticed {r['obs']}.\n\n"
      f"So we went ahead and built a free preview of how a refreshed {r['name']} site could look, using the details from your current one:\n"
      f"{BASE}/{r['slug']}/\n\n"
      "It's just a concept and nothing's live. If you like it, we can build the real thing.\n\nWorth a look?\n\n"
      "Best wishes from the CGA team\n\nIf this isn't for you, just reply \"no thanks\" and we won't email again.")
    if r.get('country') == 'US':
        body = body.replace('Had a look at your website', 'Took a look at your website').replace('Worth a look?', 'Worth a look?')
    out.append({'slug': r['slug'], 'name': r['name'], 'email': r['email'], 'subject': f"new website idea for {short}", 'body': body, 'country': r.get('country', 'UK')})
print(json.dumps(out, indent=1))
