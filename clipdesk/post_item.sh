#!/bin/bash
# Agent 8 — posts ONE queue item right now via Charlie's Pipedream link (YouTube Shorts, plus TikTok if the item has it).
# PIPEDREAM_URL=<from the task prompt, never stored in this repo> bash clipdesk/post_item.sh <day> <item_id>
# NO_TIKTOK=1 forces YouTube-only (Agent 8 sets it once today's TikTok cap is reached).
# Appends {id, at, http, platforms, md5} to clipdesk/days/<day>/posted.json (commit it afterwards). Refuses to post an id twice.
set -e; DAY=$1; ID=$2; [ -n "$PIPEDREAM_URL" ] || { echo "PIPEDREAM_URL not set"; exit 1; }
R=$(cd "$(dirname "$0")/.." && pwd); D=$R/clipdesk/days/$DAY; M=/tmp/clipdesk/$DAY/media; mkdir -p $M
[ -f $D/posted.json ] || echo '[]' > $D/posted.json
python3 -c "import json,sys; sys.exit(1 if any(x['id']=='$ID' and x.get('http')==200 for x in json.load(open('$D/posted.json'))) else 0)" || { echo "$ID already posted, skipping"; exit 0; }
read BR P <<<"$(python3 -c "import json;x=[i for i in json.load(open('$D/${QUEUE:-queue.json}'))['items'] if i['id']=='$ID'][0];print(x['branch'],x['path'])")"
if [ ! -s $M/$ID.mp4 ]; then git -C $R fetch -q origin $BR; git -C $R show FETCH_HEAD:$P > $M/$ID.mp4; fi
Q=$(python3 -c "
import json,urllib.parse
x=[i for i in json.load(open('$D/${QUEUE:-queue.json}'))['items'] if i['id']=='$ID'][0]
p={'pipedream_upload_body':'1','title':x['title'][:100],'description':x['yt_description'],'tiktok_caption':x['tiktok_caption'],'filename':'$ID.mp4'}
import os
if 'tiktok' not in x['platforms'] or os.environ.get('NO_TIKTOK')=='1': p['skip_tiktok']='1'
if 'youtube' not in x['platforms']: p['skip_youtube']='1'
print(urllib.parse.urlencode(p))")
CODE=$(curl -sS --max-time 300 -o /tmp/clipdesk/$DAY/resp_$ID.txt -w "%{http_code}" -X POST "$PIPEDREAM_URL/?$Q" -H "Content-Type: video/mp4" --data-binary @$M/$ID.mp4 || echo 000)
python3 - <<E
import json,datetime,hashlib
f='$D/posted.json'; L=json.load(open(f))
q=[i for i in json.load(open('$D/${QUEUE:-queue.json}'))['items'] if i['id']=='$ID'][0]
h=hashlib.md5(open('$M/$ID.mp4','rb').read()).hexdigest()
L.append({'id':'$ID','at':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),'http':int('$CODE'),'platforms':[x for x in q['platforms'] if not (x=='tiktok' and '${NO_TIKTOK:-0}'=='1')],'md5':h,'title':q['title']})
json.dump(L,open(f,'w'),indent=1)
E
echo "$ID HTTP $CODE $(date -u +%H:%M:%SZ)"
