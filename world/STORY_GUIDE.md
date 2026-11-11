# World videos — how to write a spec (3D presenter "Bob" in a yellow £ hoodie)

Spec file `world/specs/<ID>.json`:
{"id","title","voice":"am_puck","speed":1.1,"pitch":1.04,"scenes":[...]}

Target: 6–8 scenes, 165–195 words total => 62–75 s (TikTok pays only for 60s+). Each scene = one real place.

Scene keys:
- say: what Bob says. Excited, happy, cheeky, first person to camera. Short punchy sentences, "!" and "?!" for energy, CAPS on 1–2 key words. Jokes: self-aware asides ("I counted. Twice."), reactions ("Absolute madness!", "Genius, right?").
- place: location tag text (e.g. "Paris, France"); flag: one emoji (country flag or themed emoji).
- bg: `bg/<batch>/<name>.jpg` (Wikimedia Commons photo chosen from the bg-fetch contact sheets; keep credits.json).
- shot: wide | medium | close (first camera of the scene; the engine adds extra angles automatically: 3/4, low, high, dutch).
- gestures: 2–3 of wave, point, pointL, explain, open, shrug, count, wow, think (each also = one camera cut).
- cards: [{at:0–1 fraction of scene, big:"€2.26bn", small:"profit in one year", color:"#16a34a"|"#e11d48"|"#2563eb"|"#ea580c"|"#7c3aed", hold:3.2}] — the number the viewer should remember. Max 1 per scene, not in close shots.
- hot: words to highlight yellow in captions (numbers auto-highlight).
- fx/fy: 0–1 focus of the photo; from: -1|1 walk-in side for wide shots.
- Last scene: "end":"FOLLOW FOR MORE" and the line ends with "Follow for more!".

Hook rules (first scene, first 2 seconds): open with a shocking specific claim or question ("This man SOLD the Eiffel Tower.", "This note says ONE HUNDRED TRILLION dollars."). No intro, no "Hi guys".
Structure: hook -> "Let me explain!" -> 3–5 numbered tricks/steps, each in a new place -> twist/payoff -> follow CTA.
Facts: only state things you verified today with a source; soften legends ("or so the story goes"). No tragedies, no rumours about real people, no copyrighted characters/music/clips.
Numbers: write them as words in `say` (TTS reads them better), digits in cards.
