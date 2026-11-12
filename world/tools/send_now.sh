#!/bin/bash
# PIPEDREAM_URL=https://xxxx.m.pipedream.net bash world/tools/send_now.sh <ID> <schedule.json>
# Posts the rendered video NOW via Charlie's Pipedream link (TikTok + YouTube). URL is never stored in this public repo.
set -e; ID=$1; SCHED=${2:-world/schedule_2026-11-12.json}
[ -n "$PIPEDREAM_URL" ] || { echo "PIPEDREAM_URL not set"; exit 1; }
R=/home/claude/t00cool2clip-media; [ -d $R ] || git clone -q https://github.com/charliebouchard-png/t00cool2clip-media $R
O=/tmp/send; mkdir -p $O; cd $R; git pull -q origin main || true
if git ls-remote --exit-code origin render-ai-$ID >/dev/null 2>&1; then git fetch -q origin render-ai-$ID; git show FETCH_HEAD:clips/$ID.mp4 > $O/$ID.mp4; else git fetch -q origin world-$ID; git show FETCH_HEAD:out/$ID.mp4 > $O/$ID.mp4; fi
Q=$(python3 -c "
import json,urllib.parse
x=[v for v in json.load(open('$SCHED')) if v['id']=='$ID'][0]
print(urllib.parse.urlencode({'pipedream_upload_body':'1','title':x['yt_title'],'description':x['yt_description'],'tiktok_caption':x['tiktok_caption'],'filename':'$ID.mp4', **({'skip_youtube':'1'} if '$PLATFORM'=='tiktok' else {})}))")
curl -sS --max-time 300 -o /dev/null -w "$ID HTTP %{http_code}\n" -X POST "$PIPEDREAM_URL/?$Q" -H "Content-Type: video/mp4" --data-binary @$O/$ID.mp4
