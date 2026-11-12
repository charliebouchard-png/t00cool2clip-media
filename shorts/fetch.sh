#!/bin/bash
# bash shorts/fetch.sh <name> <youtube_id> [download_url]
# Gets the source video (download_url from the AI Producer by OpusClip tool start_link_download — YouTube blocks direct downloads here),
# metadata via yt-dlp, then transcribes the audio on GitHub (transcribe workflow). Output in /tmp/shorts/<name>/: src.mp4, src.info.json, words.json, transcript.txt
set -e; NAME=$1; VID=$2; URL=$3; R=/home/claude/t00cool2clip-media; W=/tmp/shorts/$NAME; mkdir -p $W
[ -f $HOME/ytd/yt-dlp ] || { mkdir -p $HOME/ytd; curl -sSL -o $HOME/ytd/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp; }
python3 $HOME/ytd/yt-dlp -q --no-warnings --js-runtimes node --remote-components ejs:github --extractor-args youtube:player_client=mweb,web_embedded --write-info-json --skip-download -o "$W/src.%(ext)s" -- "$VID" || true
[ -s $W/src.mp4 ] || curl -sS --max-time 1200 -o $W/src.mp4 "$URL"
ffmpeg -y -loglevel error -i $W/src.mp4 -vn -ac 1 -ar 16000 -c:a libopus -b:a 20k $W/audio.opus
T=$(mktemp -d); cd $T; git init -q; git remote add origin "$(git -C $R remote get-url origin)"
mkdir -p clipsrc/$NAME; cp $W/audio.opus clipsrc/$NAME/; git add clipsrc; git -c user.name=claude -c user.email=claude@users.noreply.github.com commit -qm "audio $NAME"; git push -q -f origin HEAD:clipsrc-$NAME
jq -n --arg n "$NAME" '{ref:"main",inputs:{name:$n}}' | gh api -X POST repos/charliebouchard-png/t00cool2clip-media/actions/workflows/transcribe.yml/dispatches --input -
sleep 25; while [ "$(gh run list -R charliebouchard-png/t00cool2clip-media -w transcribe -L 1 --json status -q '.[0].status')" != completed ]; do sleep 20; done
git fetch -q origin clipsrc-$NAME; git show FETCH_HEAD:clipsrc/$NAME/words.json > $W/words.json; git show FETCH_HEAD:clipsrc/$NAME/transcript.txt > $W/transcript.txt
echo "transcript: $W/transcript.txt ($(wc -l < $W/transcript.txt) lines)"; rm -rf $T
