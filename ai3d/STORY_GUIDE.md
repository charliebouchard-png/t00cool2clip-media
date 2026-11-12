# Writing a 3D "in my town" story (ai3d engine) — our best-performing format

Proven: the "…costs $X in my town" stories got 250–1,029 TikTok views each (11 Nov 2026) vs 8–245 for fact explainers.

File = ai3d/stories/<ID>.json: {"id","title","voice":"am_puck","speed":1.12,"seed":<int>,"key":<0-11>,"bpm":<110-130>,"hot":[6-8 words to highlight],"beats":[...]}
15–20 beats, ~180 words total (= 60–70 s). One short spoken line per beat.

Beat keys:
- "say": the line (first person, short, punchy). Beat 1 = the hook ("In my town, X costs $Y."). Last beat = twist or a comment-bait question.
- "set": bedroom | cityhall | kitchen | lab | office | park | rooftop | store | street
- "cam": close | drone | face | far | high | low | orbit | ots | pull | push | reveal | side | spin | track | wide (change every beat)
- "hero": {"pose": angry|carry|cheer|count|dance|facepalm|float|hug|idle|panic|phone|point|press|run|sad|shiver|shock|sit|sleep|sneak|talk|think|walk|wave, "face": angry|happy|normal|sad|shock|sleep|smug, optional "hold": money|mug|phone|umbrella, "holdText": short text on held phone}
- "crowd" (optional): {"action": carry|cheer|dance|float|hug|idle|jump|panic|phone|run|sit|sneak|talk|walk, "n": 4-12, "face": happy|sad|shock|sleep}
- "label" (optional): banner text while the idea is on screen, e.g. "WAITING TAX"
- "big" (optional): {"text": "£1 A MINUTE", "bg": "#e8363c"} — giant number/word slam
- "fx" (optional list): alert | cash | coins | cold | confetti | flash | question | rain | red | shake | snow | zzz
- "props" (optional list): {"type": bed|car|drone|fridge|glassfridge|sign|speaker|sun|tag|thermostat, "text"?, "color"?, "x"?, "y"?}
- "screen" (optional): text on an office/lab screen
Other keys (copy from ai3d/stories/S01–S10): "notif", "npcs", "press", "focus", "time".

Formula: absurd rule tied to something everyday or trending → it escalates 3 times → everyone reacts (crowd) → twist in the last 2 beats → comment-bait line. Keep it light; no real private people; no tragedy; no jokes about real people's private lives.
Best performer: "Every raindrop that hits you costs 10 cents in my town ☔💸 Umbrella or…" (1,029 views). Caption = the premise + emoji + a choice question.
Render: GitHub workflow `ai3d.yml` with input stories='["<ID>",...]' -> branch render-ai-<ID>, file clips/<ID>.mp4.
