#!/bin/bash
# bash shorts/fetch.sh <youtube_id> <name>  -> info + audio pushed to branch clipsrc-<name>, transcribed on GitHub, transcript pulled to /tmp/shorts/<name>/
set -e; VID=$1; NAME=$2; R=/home/claude/t00cool2clip-media; W=/tmp/shorts/$NAME; mkdir -p $W; YT="python3 $HOME/ytd/yt-dlp"
[ -f $HOME/ytd/yt-dlp ] || { mkdir -p $HOME/ytd; curl -sSL -o $HOME/ytd/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp; }
X="--js-runtimes node --remote-components ejs:github --extractor-args youtube:player_client=mweb,web_embedded"
$YT -q --no-warnings $X --write-info-json --skip-download -o "$W/src.%(ext)s" -- "$VID"
$YT -q --no-warnings $X -f "ba[abr<=80]/ba" -o "$W/audio.%(ext)s" -- "$VID"
ffmpeg -y -loglevel error -i $W/audio.* -ac 1 -ar 16000 -c:a libopus -b:a 20k $W/audio.opus 2>/dev/null || ffmpeg -y -loglevel error -i "$(ls $W/audio.* | grep -v opus | head -1)" -ac 1 -ar 16000 -c:a libopus -b:a 20k $W/audio.opus
T=$(mktemp -d); cd $T; git init -q; git remote add origin https://github.com/charliebouchard-png/t00cool2clip-media 2>/dev/null
git -C $R remote get-url origin | xargs git remote set-url origin
mkdir -p clipsrc/$NAME; cp $W/audio.opus clipsrc/$NAME/; git add clipsrc; git -c user.name=claude -c user.email=claude@users.noreply.github.com commit -qm "audio $NAME"; git push -q -f origin HEAD:clipsrc-$NAME
jq -n --arg n "$NAME" '{ref:"main",inputs:{name:$n}}' | gh api -X POST repos/charliebouchard-png/t00cool2clip-media/actions/workflows/transcribe.yml/dispatches --input -
sleep 20; while [ "$(gh run list -R charliebouchard-png/t00cool2clip-media -w transcribe -L 1 --json status -q '.[0].status')" != completed ]; do sleep 20; done
git fetch -q origin clipsrc-$NAME; git show FETCH_HEAD:clipsrc/$NAME/words.json > $W/words.json; git show FETCH_HEAD:clipsrc/$NAME/transcript.txt > $W/transcript.txt
echo "transcript: $W/transcript.txt ($(wc -l < $W/transcript.txt) lines)"
