# Learnings (newest first) — what top short-form videos do that we copy

## 2026-11-14 (daily run, TikTok via yt-dlp 05:15 UK)
- Friday-13th fact video (posted 21:29 on the day itself) got 238 views in ~8 h = our best world fact video since Ryanair. Same-day date hooks work; day-old news (Nvidia 1–48) doesn't. -> Today's fact video is about something happening TODAY in London (Lord Mayor's Show, 14 Nov: 1215 King John deal, 1757 £2m coach, 6,500 people, river boats back for the 1st time since 2017) and goes out while it's still "today".
- PROBLEM: yesterday's 2 stories (A261113-1 step tax, A261113-2 Christmas tax) rendered fine but do NOT appear on @t00cool2clip — the 12:00/18:00 sends seem to have failed (Pipedream/Buffer fix commits landed later that night). Check the HTTP code AND that the post actually shows on the profile after each send.
- A separate task posted 10 "como se dice" meme clips 01:34–02:01 today (0–181 views; one hit 181, most <35). Bursts of many posts in 30 min again split reach — keep our 3 spaced.
- Stories keep the winning "physical thing everyone does" rule: today LOOKING at prices (tied to Black Friday in 2 weeks) and YAWNING (contagious = built-in viewer participation: "did you yawn? pay up"). Twists avoid the lab/machine template: look-away loophole + mayor's salary hits $0; boring mayor gets rich from yawns until my sock-drawer speech out-bores him.
- Fact style rotated vs yesterday (zara/chunk/Oswald/cool/whip) -> ollie/box/Fredoka/warm/zoom. Medium shots hide the backdrop (the coach was invisible in a still) — use "wide" when the place IS the point.
- bg-fetch fails if a query contains an apostrophe (breaks '${{ inputs.queries }}' quoting) — write "Lord Mayors Show".
- Web trend lists still generic (no usable sound/format); vidIQ not used (credits).

## 2026-11-13 (daily run, TikTok via yt-dlp 05:15 UK)
- Still the same split: 11 Nov "in my town" stories 91–1,030 views (raindrop 1,030, word tax 321, swipe 302, sleep 254, sun 91 = weakest); 12 Nov world fact videos 8–88 (+Ryanair 246). Nvidia "resigned" news videos 14–45: late/news-recap facts flop.
- Top story pattern: a tax on something EVERY viewer does constantly and physically (raindrops, words, swipes) + a self-referential line ("this video cost me $212") beats abstract ones (sunlight, gravity). -> Today: STEP tax (everyone walks; comment bait "tell me your steps, I'll tell you what you owe") and CHRISTMAS-before-December tax ("I just said it, -$50"), riding the live "is November too early for Christmas?" debate.
- All 10 earlier stories end the same way (secret lab, machine, button). Feed may read it as a template -> today's twists avoid the lab: a loophole (take shoes off) and the mayor caught breaking his own rule.
- Fact video tied to TODAY (Friday 13th, the 3rd of 2026 = the max a year can have) rather than day-old news; posted 20:30 while the date is still live.
- Web trend lists were generic this week (no single dominant sound/format we can use); vidIQ not used (credits).

## 2026-11-12 OUR OWN DATA (TikTok, pulled 19:49)
- "…costs $X in my town" absurd 3D stories (11 Nov): 91–1,029 views, most ~250–320; raindrop tax 1,029.
- World fact videos: Ryanair 245, Zimbabwe 88, Tulips 8, daily-run can metal 23, Black Friday 27, Nvidia recap 41 (45 min), Nvidia timeline 1 (15 min).
- ~12 posts on 12 Nov = too many; switched to 3/day (2 stories + 1 fact). Late news (Nvidia, a day old) underperformed.

## 2026-11-12 (from Charlie: Iman Gadzhi "Give Me 26 minutes, I'll Give You 10,000 hours of Claude Knowledge", 1.9M views)
- Value-compression title/hook: "Give me X seconds, I'll give you Y years of Z" — promises a huge payoff for tiny time. Use as a hook card/title formula ("Give me 40 seconds, I'll explain 400 years of money").
- Qualify the viewer in line 1 ("If you hate wasting money, watch this") — makes the right people stay.
- Clear numbered progression (tip 1→10, beginner→advanced) + callbacks to an earlier promise reward watching to the end.
- Riding a hot topic (Claude/AI) with a famous comparison (Jarvis/Tony Stark) makes an abstract idea concrete.

## 2026-11-12
- OUR STATS (Metricool, TikTok, last 3 weeks): brand/everyday "how X makes money" videos (Ryanair 394 views, car wash 335, Greggs 321, gym 310) beat generic "Did you know 🤔 #fyp" posts (~22–30 views each) by >10x. Specific, keyword-rich captions about something people already know win; #fyp spam does nothing. -> Today: everyday hooks people recognise (Black Friday, Christmas cards/stamps, the drink can), specific captions, no #fyp.
- LENGTH: 2026 Shorts data says single-idea clips win at 15–20 s and STORIES at 45–58 s; 25–40 s is the weak middle (taletok). 50–60 s gets the best watch-through (~76%, anijam). -> All 3 today are ~57–62 s stories (target "youtube"), not 35–45 s.
- RETENTION: most viewers drop in the middle 40%; land the payoff 3–5 s before the end; replay rate >15% = loop potential. -> Mid-video pattern interrupts (badge + emoji burst + card around the 40–60% mark), payoff then a one-line loop back to the hook.
- CAPTIONS: ~85% watch first with sound off; burned-in 1–3 words per frame beats auto-captions. -> chunk/box/word caption modes, hook card in frame 1.
- FORMAT: TikTok's November winners are reveal formats ("last slide shows what really happened" carousels) and seasonal switches (Christmas content from 1 Nov, Black Friday). Rotate hook structures (question, specific claim, myth-bust) every few posts so the feed doesn't see a template. -> Today: guess-the-price (poll first), myth vs fact, then vs now.
- vidIQ was out of credits today (couldn't pull outliers); research came from web sources + our own Metricool stats.

## 2026-11-11 (seed)
- Top Shorts in our space (e.g. "If your shorts get under 1,000 views", 2.7M views) win on: a pain/curiosity title, proof in the first 20 s, a numbered list promised up front, a visual change every 5–10 s, stories over lectures, and explicit comment prompts (77k comments).
- Our early TikToks flopped from: 10 posts in 10 minutes at 3 a.m., vague captions ("Did you know this?"), 5-minute landscape videos on TikTok, reposted clips. Best performers: a 17 s original product clip (251 views) and a specific shocking story caption (88 views).
- Applied: hook card in frame 1, open loop by 3 s, cuts every 2–3 s, 60–70 s, looped ending, poll for comments, 5 posts/day spaced ≥2 h.

## Engine wishlist
- Backdrop framing: fx/fy on the curved backdrop is not intuitive (higher fy shows the TOP of the photo) and tall shots zoom in hard; a "fit whole image" option would help paintings, cards and engravings.
- Wider badges (text like "MYTH 1") — the round badge only fits ~2 characters.
- Two presenters talking to each other (dialogue format).
- Real-world 3D props (giant coin, stone wheel) next to the presenter.
