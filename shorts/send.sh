#!/bin/bash
# PIPEDREAM_URL=... bash shorts/send.sh <name> <n>  -> posts clip n of batch <name> to YouTube ONLY (skip_tiktok=1) right now.
# Final clips live on branch shorts-<name> as shorts/out/<name>/final_<n>.mp4; titles/descriptions from shorts/plans/<name>.json
set -e; NAME=$1; N=$2; [ -n "$PIPEDREAM_URL" ] || { echo "PIPEDREAM_URL not set"; exit 1; }
R=/home/claude/t00cool2clip-media; [ -d $R ] || git clone -q https://github.com/charliebouchard-png/t00cool2clip-media $R
cd $R; git pull -q origin main || true; O=/tmp/send; mkdir -p $O
git fetch -q origin shorts-$NAME; git show FETCH_HEAD:shorts/out/$NAME/final_$N.mp4 > $O/s_$NAME_$N.mp4
Q=$(python3 -c "
import json,urllib.parse
p=json.load(open('shorts/plans/$NAME.json')); c=p['clips'][$N-1]
desc=c.get('description','')+'\n\nClip from: '+p['source_title']+' by '+p['channel']+' https://youtu.be/'+p['video_id']+'\n\n#shorts'
print(urllib.parse.urlencode({'pipedream_upload_body':'1','title':c['title'][:100],'description':desc,'tiktok_caption':c['title'],'filename':'$NAME-$N.mp4','skip_tiktok':'1'}))")
curl -sS --max-time 300 -o /dev/null -w "$NAME clip $N HTTP %{http_code}\n" -X POST "$PIPEDREAM_URL/?$Q" -H "Content-Type: video/mp4" --data-binary @$O/s_$NAME_$N.mp4
