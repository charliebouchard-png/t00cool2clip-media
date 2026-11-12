# World videos — how to write a spec (3D presenters visiting real places)

Spec file `world/specs/<ID>.json`:
{"id","title","cast":"<cast key>","hook":"LINE 1\nLINE 2 😳","scenes":[...]}

Cast (world/cast.json, each has its own look + voice; since 12 Nov 2026 all presenters use the chunky blocky toy body, look.body = "blocky" — keep them ORIGINAL: never recreate Steve/Alex or any Minecraft or other game character, skin, logo or item, and never name Minecraft in scripts, captions or hashtags): bob, maya, dev, zara, ollie, gran, kai. Use a DIFFERENT presenter for every video on the same day, and rotate so no presenter appears twice in a row across days. Match presenter to topic when it adds a joke (gran for "what £1 bought in 1970", dev for finance scams, ollie for UK prices).

Read world/PLAYBOOK.md first; it overrides anything below.
Top-level `"target"`: "tiktok" (35–45 s: 4–6 scenes, ~105–145 words) or "youtube" (55–65 s: 6–8 scenes, ~170–205 words). Each scene = one real place. Speech runs ~3.3 words/s.
Run `python3 world/tools/lint_spec.py world/specs/<ID>.json` and fix every FAIL before rendering.

Scene keys:
- say: what Bob says. Excited, happy, cheeky, first person to camera. Short punchy sentences, "!" and "?!" for energy, CAPS on 1–2 key words. Jokes: self-aware asides ("I counted. Twice."), reactions ("Absolute madness!", "Genius, right?").
- place: location tag text (e.g. "Paris, France"); flag: one emoji (country flag or themed emoji).
- bg: `bg/<batch>/<name>.jpg` (Wikimedia Commons photo chosen from the bg-fetch contact sheets; keep credits.json).
- shot: wide | medium | close (first camera of the scene; the engine adds extra angles automatically: 3/4, low, high, dutch).
- gestures: 2–3 of wave, point, pointL, explain, open, shrug, count, wow, think (each also = one camera cut).
- cards: [{at:0–1 fraction of scene, big:"€2.26bn", small:"profit in one year", color:"#16a34a"|"#e11d48"|"#2563eb"|"#ea580c"|"#7c3aed", hold:3.2}] — the number the viewer should remember. Max 1 per scene, not in close shots.
- hot: words to highlight yellow in captions (numbers auto-highlight).
- fx/fy: 0–1 focus of the photo; from: -1|1 walk-in side for wide shots.
- No end card and no "follow for more" outro: the last line must LOOP into the first line (e.g. last line "...and that's why this flight cost me" -> first line "fifteen quid?!"). Put any follow ask mid-video ("follow, because trick three is the craziest") instead.

Script formula: hook (paradox/shock, ≤12 words, 'you') -> foreshadow the payoff -> 2–3 escalating but/therefore details -> 'You see…' pivot -> explanation as a story -> twist in the last second that loops into the first line. See PLAYBOOK §3.
Hook rules (first scene, first 2 seconds): open with a shocking specific claim or question ("This man SOLD the Eiffel Tower.", "This note says ONE HUNDRED TRILLION dollars."). No intro, no "Hi guys".
Structure: hook -> "Let me explain!" -> 3–5 numbered tricks/steps, each in a new place -> twist/payoff -> follow CTA.
Facts: only state things you verified today with a source; soften legends ("or so the story goes"). No tragedies, no rumours about real people, no copyrighted characters/music/clips.
Numbers: write them as words in `say` (TTS reads them better), digits in cards.

## FYP optimisation (every video)
- 0–1 s: hook text card (`hook`, max ~6 words, 1–2 lines, 1 emoji) + spoken hook start in frame 1, no logo/intro. Cards in scene 1 must start after 2.8 s.
- 1–3 s: an open loop ("…and the third one is the craziest") so people stay.
- Change something on screen every 2–3 s (the engine cuts camera per gesture: give every scene 3 gestures; keep scenes 6–10 s).
- 60–70 s total (creator rewards need 60 s+); no dead air (engine keeps gaps ≤0.35 s).
- Ending loops into the start (see above) so replays count.
- One comment-bait question near the end ("Would YOU pay that?").

## Originality / shadowban safety
- Every video is new: new script, new presenter rotation, new locations, new music seed (id). Never re-upload a posted video or a lightly edited copy; never post the same video to two TikTok accounts.
- No copyrighted clips, music, logos as the main subject, or watermarks from other apps.
- Captions: 1 sentence + 3–5 specific hashtags (no #fyp/#foryou spam, no follow-for-follow); vary wording every post.
- Facts: verified with a source today; no misleading health/finance claims, no "get rich quick" promises, no dangerous challenges, no real private people.
- AI disclosure: the voices are AI. Charlie should turn on TikTok's "AI-generated content" label (Settings > ... or the toggle when posting) — the Pipedream/Buffer post may not set it.

## Style options (make every video look/feel different)
Top-level `"style"`: {
  "captionMode": "word" | "chunk" (3 words, active word highlighted) | "box" (word on a coloured sticker),
  "captionFont": "Fredoka" | "ArchivoBlack" | "Bebas" | "Oswald" | "Poppins" | "Caveat",
  "captionY": 1150–1400, "boxColor": "#fef08a", "boxText": "#111",
  "grade": "none" | "warm" | "cool" | "punchy" | "retro" | "dreamy",
  "transition": "flash" | "whip" | "zoom" | "glitch" | "cut",
  "progress": true  (thin progress bar at top) }
Top-level `"hook"` (text card for the first 2.6 s), `"hookBg"`, `"hookColor"`.
Per scene: `"badge":"#3"` (countdown sticker), `"emoji":"😱","emojiAt":0.3` (emoji burst), `"poll":{"q":"Would YOU pay that?","a":"YES","b":"NO","at":0.3}` (comment bait, use once per video, late scene).
Formats to rotate (never the same format twice in a day): countdown list (#5→#1), "crazy true story" narrative, "guess the price" (poll first, answer after), myth vs fact, "rating things out of 10", "I tried to explain X in 60 s", "then vs now" price comparison.
Within a day no two videos may share the same presenter + captionMode + grade + format combination.
