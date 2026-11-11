# Daily world videos — runbook for the scheduled Claude run

Goal: 5 new 60–75 s vertical videos a day for Charlie's TikTok (@t00cool2clip) + YouTube, 3D presenter Bob explaining a topic while visiting real places. Maximise views and watch time.
Repo: public github.com/charliebouchard-png/t00cool2clip-media, folder `world/` (clone to /home/claude/t00cool2clip-media). Writing guide: `world/STORY_GUIDE.md`.
Pipedream link: given in the scheduled task prompt only (NEVER write it to the repo). It posts to TikTok + YouTube IMMEDIATELY when called (it ignores post_at), so posting time = sending time.

## Steps (all today, London time)
1. Research (≥6 WebSearch queries): what's trending today in the UK/US on TikTok and YouTube (news, money, consumer stories, sport, gaming, launches, seasonal events, viral formats). Pick 5 topics that (a) Bob can explain with a "how/why money" or "crazy true story" angle, (b) have a shocking hook, (c) visit 6–8 photographable real places, (d) aren't in `world/topics_done.json`. Mix: ~3 trending-today, ~2 evergreen viral (scams, heists, weird money history, everyday-price psychology; the MV001–MV100 idea list in explainer/specs is a good bank).
2. IDs: `D<YYMMDD>-<n>` (n=1..5). Write 5 specs per STORY_GUIDE (verify facts with sources).
3. Backgrounds: dispatch `bg-fetch` workflow once per video (name = id lowercased, queries = JSON list of 6–8 Commons searches). Wait, fetch branch `bg-<name>`, view `cand/<name>/sheet_q*.jpg`, pick the best photo per scene (portrait or wide, recognisable, no people's faces close-up, no logos dominating), copy to `world/bg/<name>/<scene>.jpg`, write `credits.json` from meta.json.
4. Check: render stills locally for each spec (`node world/render.js <spec> - - stills:1,10,20,30,40,50` in its own temp dir) and look at them: framing, cards not on the face, correct places.
5. Commit + push, dispatch `world-videos` with ids=[5 ids]. Wait (~45 min). Download `out/<id>.mp4` from branch `world-<id>` (git fetch + git show). Check duration 60–80 s and look at a frame sheet.
6. Write `world/schedule_<YYYY-MM-DD>.json`: [{id, tiktok_caption (hook ≤110 chars + 4–5 hashtags incl. #3danimation #fyp, then blank line + "Photos: Wikimedia Commons (<artists>), CC BY/BY-SA & public domain"), yt_title (≤70 chars + " #shorts"), yt_description (1–2 lines + photo credit + 3 hashtags)}]. Append topics to `world/topics_done.json`. Commit + push.
7. Post times: 08:00, 12:00, 15:00, 18:00, 21:00 (skip any already past; if late, space the rest ≥90 min apart, last ≤22:30). Strongest hook goes at 18:00, second strongest at 12:00. For each video create a send_later at (time − 2 min) with message: `export PIPEDREAM_URL=<link>; bash /home/claude/t00cool2clip-media/world/tools/send_now.sh <ID> world/schedule_<date>.json` (clone the repo first if missing) then report HTTP code.
8. Message Charlie (SendUserMessage): the 5 titles + times. On any failure, say exactly what failed.

## Never
Post anything not made in this run; resend a video already sent; put the Pipedream link in the repo; use copyrighted clips/music/characters; invent facts.
