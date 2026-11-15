# ClipDesk learnings (newest first, keep < 120 lines)

- 2026-11-15: make.py fix — every clip before today started ~1 s early (1 s of the previous sentence) and lost its last ~1 s (the payoff). Fixed; jump-cuts now remove pauses > 0.35 s (test clip 40.9 s -> 35.4 s).
- 2026-11-15: TikTok API allows ~15 posts/day per account (spam_risk_too_many_posts beyond). YouTube gets everything.
- 2026-11-15: emoji (🎥) in the ASS credit rendered as a box on every clip; credit is now plain 'via <channel>'. Quiz/edited sources with their own on-screen text need "noface": true.
