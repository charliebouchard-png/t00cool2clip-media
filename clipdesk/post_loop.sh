#!/bin/bash
# Agent 8 — posts several approved items, GAP minutes apart (default 10). Run it with the Bash tool's run_in_background
# and keep the session alive (Monitor/until-loop on the log) until it finishes, or a background job dies after the reply.
# PIPEDREAM_URL=... bash clipdesk/post_loop.sh <day> <first_delay_sec> <id1> <id2> ...
# Log: /tmp/clipdesk/<day>/post.log  (one line per item: "<id> HTTP <code> <time>")
DAY=$1; FIRST=$2; shift 2; GAP=${GAP:-600}; R=$(cd "$(dirname "$0")/.." && pwd); L=/tmp/clipdesk/$DAY/post.log; mkdir -p /tmp/clipdesk/$DAY
sleep $FIRST; n=0
for ID in "$@"; do
  [ $n -gt 0 ] && sleep $GAP
  bash $R/clipdesk/post_item.sh $DAY $ID >> $L 2>&1 || echo "$ID ERROR $(date -u +%H:%M:%SZ)" >> $L
  n=$((n+1))
done
echo "LOOP DONE $(date -u +%H:%M:%SZ)" >> $L
