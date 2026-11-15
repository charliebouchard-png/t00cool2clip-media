#!/bin/bash
# bash clipdesk/transcribe_url.sh <name> "<download_url>"  -> transcribes on GitHub straight from the URL (no big local download),
# waits, and writes /tmp/shorts/<name>/words.json + transcript.txt. Safe to run several in parallel.
set -e; N=$1; U=$2; R=$(cd "$(dirname "$0")/.." && pwd); W=/tmp/shorts/$N; mkdir -p $W
bash $R/clipdesk/dispatch.sh transcribe.yml name=$N src_url="$U"
for k in $(seq 1 180); do sleep 20; git -C $R fetch -q origin clipsrc-$N 2>/dev/null && git -C $R cat-file -e FETCH_HEAD:clipsrc/$N/transcript.txt 2>/dev/null && break; done
git -C $R show FETCH_HEAD:clipsrc/$N/words.json > $W/words.json; git -C $R show FETCH_HEAD:clipsrc/$N/transcript.txt > $W/transcript.txt
echo "$N: $(wc -l < $W/transcript.txt) lines"
