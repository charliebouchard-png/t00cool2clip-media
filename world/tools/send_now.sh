#!/bin/bash
# bash world/tools/send_now.sh W004  -> posts NOW via Charlie's Pipedream link (TikTok + YouTube), captions from schedule json
set -e; ID=$1; R=/home/claude/t00cool2clip-media; O=/tmp/send; mkdir -p $O
cd $R; git fetch -q origin world-$ID; git show FETCH_HEAD:out/$ID.mp4 > $O/$ID.mp4
Q=$(python3 -c "
import json,urllib.parse,sys
x=[v for v in json.load(open('world/schedule_2026-11-12.json')) if v['id']=='$ID'][0]
print(urllib.parse.urlencode({'pipedream_upload_body':'1','title':x['yt_title'],'description':x['yt_description'],'tiktok_caption':x['tiktok_caption'],'filename':'$ID.mp4'}))")
curl -sS --max-time 300 -o /dev/null -w "$ID HTTP %{http_code}\n" -X POST "https://eom74a775ehh3yj.m.pipedream.net/?$Q" -H "Content-Type: video/mp4" --data-binary @$O/$ID.mp4
