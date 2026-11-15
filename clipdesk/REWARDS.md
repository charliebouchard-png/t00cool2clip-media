# Content Rewards sweep (Whop clipping campaigns)

Charlie wants ClipDesk to earn from Content Rewards campaigns. Status (2026-11-15 evening): Charlie OK'd joining 5 campaigns (below). Clips go to the HUD approval box; nothing is posted
or submitted until he approves there. Campaign clips would go on @t00cool2clip.

## How to sweep
Needs Charlie signed in to Whop in the Claude desktop app's built-in browser (sites whop.com + contentrewards.com allowed).
Open https://contentrewards.com/c/discover, then in the page run (javascript tool):

    let all=[],cur=null;for(let k=0;k<30;k++){const u='/api/campaign/campaigns/discover?collapseGroups=true&limit=50&view=summary&sortBy=newest'+(cur?'&cursor='+encodeURIComponent(cur):'');
      const j=await (await fetch(u)).json();all.push(...j.data);cur=j.pagination&&j.pagination.nextCursor;if(!cur||!j.data.length)break}

Each campaign: name, organizationName, description, budgetCents, cpmMaxRateCents/primaryPayoutCents, platforms, requiresApplication,
listedAt, metrics {creatorCount, budgetSpentCents, totalViews}. Full detail incl. min/max payout per clip:
GET /api/campaign/campaigns/<id> → data.configuration.payoutModel[{platform, rate (cents/1K), minPayout, maxPayout}].

Filter: active, payoutType cpm, ≥ $1,500 left, listed in the last ~4 weeks, real clipping (source footage provided — skip UGC /
"film yourself" / product-in-hand), TikTok or YouTube allowed, no gambling, no politics, no follower minimum we can't meet.
Score = CPM × budget left ÷ (clippers + 5). Note each campaign's minPayout: a clip earns nothing until it clears it.

## Shortlist 2026-11-15 (703 live CPM campaigns swept)
| Campaign | Org | $/1K | Left | Clippers | Platforms | Min payout/clip | Source |
|---|---|---|---|---|---|---|---|
| $20,000+ Social Media Justice | Reach | 2.00 | $19.8K | 8 | TT, YT, IG | $10 | youtube.com/watch?v=6uSskUaDL90 (+ supporting footage allowed) |
| SEGA – STRANGER THAN HEAVEN Act 2 Trailer | Clipping Culture | 2.00 (IG 1.50) | $23.9K | 8 | TT, YT, IG | $2 | official trailer |
| $10,000 ThreadGuy | Reach | 1.00 | $8.2K | 6 | TT, YT, IG | $10 | youtube.com/@notthreadguy, twitch.tv/threadguy |
| $5,000 Vookum | Vookum Clippers | 1.50 | $4.4K | 6 | all | $5 (max $400) | rules: vookums-clippers.whop.site |
| Tim Chao Official | Tim Chao Clips | 2.00 | $4.9K | 1 | TT, IG only | $6 | approved content folder |
Also seen: Perplexity x Ecomm Cowboy podcast ($2, $15.9K, 24 clippers), Frontier x Phantom X stream ($2.50, $12K, 0 — TT/IG/X only),
The Loaded Tea Shop Uber clips ($1, $50K, 1 — their footage + watermark), CNPL pickleball ($1.50, $2.5K, 1).
Skipped: Gumbo / Roobet (gambling), UNO (200K+ pages only), UGC campaigns (need Charlie on camera).

## What actually gets views (research 2026-11-15)
Content Rewards data: 432 campaigns with 15+ approved clips; average views per approved clip (mean, skewed by big pages).
- Highest per clip: sound/music meme campaigns (category avg 58K; Harlow Dolce "Wrong Number" 188K, ChainsFR Como Se Dice 125K),
  streamer/YouTuber personal-brand clipping (Nico Grigg 167K, ThreadGuy 99K, Michael Sartain 95K, Sabri Malle 88K; JasonTheWeen
  102M views total from 20K clips), lifestyle/high-energy (Deniz Inan 100K).
- Lowest per clip: tech/apps 1.4K, movie/TV clips 1.7–1.8K, sports 3K, podcasts 3.8K, gaming 4K, interview podcasts 1.4K.
- Top clips look like: streamer IRL drama/flex moments ("Joe Bart still doesn't believe Jason owns the Maybach 😭"), meme caption
  over the trending song ("WE are listening to this🔥"), award-show/live moments. Short, start mid-action, creator @'d in caption.
- Our own TikTok (@t00cool2clip, last 60 posts): 0–376 views each, best ever 1,037 ("in my town" raindrop tax). Our 10 Como Se Dice
  edits got 17–376 while that campaign averages 125K per clip -> the gap is account reach/trust, not the campaign.
- Growth research (ClipFlip 44K clips; clipper guides): 7–15 s clips get the highest average views on TikTok (Shorts can go 45–60 s);
  first frame must already be interesting (decision in ~0.8 s); a cut every 2–3 s; one niche (~3 posts/day for 2+ weeks) so the
  algorithm finds an audience; mixed niches and unedited re-uploads get stuck at ~200 views; post on new campaigns within hours.

## Joined 2026-11-15 (niche: Creators & Streamers)
Plans: shorts/plans/{milk4,clash1,hslj5,thread1,thread2}.json (renders on branches cd-<name>).
- MilkXP Ep 4 (Clip Farm, $1.25/1K): watermark clipdesk/assets/milkxp_wm.png, tag @milkxpofficial, no swearing, no other drinks/brands,
  no health/best claims, positive only, keep up 30 days, don't comment on their videos, submit demographics.
- Clash x HOH NFL trivia (Clip Farm, $1.25/1K, min $3.75 TT / $6.25 YT): @Clash.hoh (TikTok) / @Clash (YouTube), ≥10 s, no swearing,
  no other sports brands, say where the full episode is.
- HardScope Love & Justice Ep 5 (Clip Farm, $1/1K): #loveandjustice, @hardscope / @HardScopeTV, ≥7 s, never mention FaZe, no politics,
  no explicit content, Ep 5 only, no duplicate submissions to other agencies.
- ThreadGuy (Reach, $1/1K, payout from 10K views, $10 min): #ThreadGuy in caption, ThreadGuy must be the main focus, never negative,
  no logos of any kind, ≥50% audience in US/CA/UK/AU/NZ, submit within 30 min of posting, no AI content / botting (one strike = banned
  from all Reach campaigns).
- IShowSpeed x Expedia (Reach): footage 2:56:29→end of youtube.com/live/Kyv61l2vF6M, must feature Expedia, #IShowSpeed, submit
  within 30 min. BLOCKED: stream is 3 h, OpusClip caps at 30 min and YouTube bot-checks GitHub runners. Needs the file from Charlie.
