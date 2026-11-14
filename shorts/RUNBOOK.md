# Daily YouTube Shorts clipping — runbook for the scheduled Claude run

Charlie's split (12 Nov 2026): YouTube Shorts = clips; TikTok = the AI videos. Every day: find the best trending video, cut its 5 best moments into Shorts, post them to YouTube ONLY, 1 hour apart.

## 1. Pick today's source video
- Search YouTube for videos uploaded today, sorted by views (yt-dlp search URL with `sp=CAMSBAgCEAE%3D`; if nothing fits, this week `sp=CAMSBAgDEAE%3D`), e.g. queries: podcast, interview, streamer, funny moments, challenge, story, debate, prank, money, sports podcast.
  `python3 ~/ytd/yt-dlp --no-warnings --flat-playlist -I 1:20 --print "%(id)s|%(view_count)s|%(duration)s|%(channel)s|%(title)s" "https://www.youtube.com/results?search_query=<q>&sp=CAMSBAgCEAE%3D"`
- Must be: English, 8–30 minutes (the downloader's limit is 30 min), lots of talking with clear standalone moments (podcasts, streamers, commentary, challenges), the highest views/hour you can find.
- Avoid: politics/news, music videos, films/TV/sports-match footage, kids' content, tragedies, a channel used in the last 3 days (check shorts/plans/), and videos that are themselves mostly re-uploaded footage.
## 2. Get it and transcribe
- Call the AI Producer by OpusClip tool `start_link_download` with the YouTube URL (free; wait_seconds 300). YouTube blocks direct downloads from our servers, so this is the only way to get the file.
- `bash shorts/fetch.sh <name> <video_id> "<download_url>"` (name = `y<YYMMDD>`). ~5–10 min. Gives /tmp/shorts/<name>/transcript.txt and words.json.
## 3. Choose the 5 best moments (read the whole transcript)
- 25–55 s each, non-overlapping, each understandable with no context, starting on a strong line (a claim, a question, a reaction) and ending right after the payoff/laugh. Funniest/most surprising first.
- Clip START: the first spoken word must land in the first 0.5 s — never open on silence, laughter or a host's setup line. Cut straight into the most surprising sentence, then let the context follow.
- Clip END: stop on the laugh/payoff; if possible end on a line that makes the start make sense again (loop).
- Hook = an open question or a bold claim that makes them NEED the answer ("SHE SAID WHAT\\NAT THE OSCARS?"), not a label ("HUNGER GAMES STAR'S\\NSURVIVAL PLAN").
- Hook (top text, 2 lines, ≤8 words, CAPS, use \\N for the line break, NO emoji — they render as blanks), title (≤70 chars + " #shorts", emoji ok), 1-line description.
- Write shorts/plans/<name>.json: {"name","video_id","source_title","channel","clips":[{"start","end","hook","title","description"}]} (start/end in seconds of the source).
## 4. Make, check, store
- Needs OpenCV for the face-tracked crop: `python3 -c 'import cv2' || pip install --break-system-packages opencv-python-headless`.
- make.py now crops FULL-SCREEN 9:16 on the speaker's face (follows the face as it moves / as the shot changes). If it can't find faces it falls back to the old small-video-on-blur layout — that layout performs worse, so prefer source videos where faces fill the shot (podcasts, streamers, face-cam).
- `python3 shorts/make.py shorts/plans/<name>.json` (≈3–4 min per clip) -> /tmp/shorts/<name>/final_<n>.mp4 (9:16, blurred background, captions with active word, swear words masked, hook title, channel credit).
- Check each: duration, and look at 2 frames (hook readable, captions not covering faces).
- `bash shorts/push_out.sh <name>`; commit the plan to main (attribution lines from your system prompt).
## 5. Post (YouTube only)
- Only if world/PIPEDREAM_ROUTING_READY exists (it means Charlie updated Pipedream so skip_tiktok works). If it doesn't, don't post; tell Charlie the clips are ready and that the Pipedream step needs updating.
- Times London: 13:00, 14:00, 15:00, 16:00, 17:00 (skip past ones; keep 1 h gaps). For each, create a send_later (into this session) at 2 minutes before: `export PIPEDREAM_URL=<link from the task prompt>; bash /home/claude/t00cool2clip-media/shorts/send.sh <name> <n>` and report the HTTP code.
## Never
Post to TikTok from this run; post the same clip twice; clip a video longer than 30 min by re-uploading parts; remove the channel credit; put the Pipedream link in the repo.
