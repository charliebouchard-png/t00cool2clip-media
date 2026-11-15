# Content Rewards sweep (Whop clipping campaigns)

Charlie wants ClipDesk to earn from Content Rewards campaigns. Status: RESEARCH ONLY (his call, 2026-11-15) — do not join,
post or submit anything for a campaign until he says so. Campaign clips would go on @t00cool2clip.

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
