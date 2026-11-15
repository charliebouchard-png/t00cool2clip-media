# Agent Quill – finding new leads (only when Charlie presses "Find new leads")

**Goal:** find new small businesses with weak websites, build each a free preview site, and add them to Charlie's Applicants list with a pitch email ready to send.

- **How many:** the button's message gives the number, e.g. "find 20". If it doesn't say, find 20.
- **Where:** use the areas it gives. If it gives none, use Surrey, London (SW/N/W) and Essex.
- **Never Northamptonshire.** Charlie's rule: no leads anywhere in Northamptonshire (Northampton, Kettering, Corby, Wellingborough, Daventry, Rushden, Towcester, Brackley, Oundle and every village around them, and any NN postcode). Don't search there, and skip any business based there even if it turns up elsewhere. `add.py` also refuses them.
- **No sending:** pitches only go out when Charlie presses "Send emails".

## Setup

1. Run:
   ```
   git clone https://github.com/charliebouchard-png/t00cool2clip-media /home/claude/t00cool2clip-media
   cd /home/claude/t00cool2clip-media
   git fetch origin gh-pages
   git worktree add ../pages origin/gh-pages -B gh-pages
   ```
   (or `git pull` in both if they already exist).
2. Load ArtifactData and the Claude Docs tools with ToolSearch.
3. Set `agents/quill` to `{state: "working", doing: "Finding new leads", updatedAt}` in the app (https://claude.ai/artifact/UuRFwL8Vhx5sPsgQmY8rWi).

## Research method (same as before)

- **Search:** use WebSearch in "extended" mode, with queries like "<trade> <3-5 towns> own website family run". Send several searches in the same turn. Only fetch URLs that came back in search results.
- **Avoid repeats:** `leads/rejected.txt` and `leads/prospects.jsonl` list businesses already checked. Try trades not already covered.
- **Check each site:** WebFetch it with this prompt:
  `Compact JSON only: {"name","town","emails_on_page":[...],"phone","address","hours":[[d,t]],"services":[[name,price]](max 8),"about"(1 factual sentence),"owner"(name+role if written),"issues":[[problem,exact quote]](concrete only: old copyright year, placeholder/template text, broken/empty links, typos, outdated notices),"dated":1-10}`
- **Keep** the business only if all of these are true:
  - It's a small independent business (not a chain).
  - It has an email address visible on its own site.
  - It has at least one real, checkable problem you can quote word for word, such as an old copyright year, template text, a dead link, a wrong phone link, a typo or an outdated notice.
- **Skip** modern sites that already look good. Log each reject in `leads/rejected.txt`.
- **The record for each keeper:** fields `name`, `short?`, `cat`, `trade`, `town`, `site`, `email`, `phone`, `address`, `hours`, `services`, `since`, `about`, `socials`, `obs`, `greet?`.
  - `cat` must be one of: dog florist cafe hair beauty health cleaning garden trades fitness tutor stay shop cakes events riding dance boarding petcare
  - `obs` is a lowercase clause that follows "Had a look at your website and noticed ...". It must be true and specific.
  - Never invent anything.
- **Add the batch:** `python3 leads/add.py <<'EOF' [ ...records... ] EOF`. It removes duplicates and prints `NEW_SLUGS ...`.

## After each batch of about 10 new leads

1. **Build the previews:** `python3 leads/build.py ../pages`, then commit and push gh-pages (`git pull --rebase origin gh-pages` first). End the commit message with your session's attribution lines.
2. **Compose the pitches:** `python3 leads/compose.py <new slugs...>` prints the pitch emails as JSON.
3. **Write to Client Files** with one ArtifactData `batch` per 50 writes:
   - `set leads/<slug>`:
     ```
     {id, name, owner (as written on their site with role, or null), ownerSrc,
      phone, email, type: <trade>, area: <town>, website: <site>,
      address, preview: "https://charliebouchard-png.github.io/t00cool2clip-media/<slug>/",
      about: <about + " Services: " + service names>,
      help: "Their website: " + obs + ". Pitch: free website concept (£200 to build + £25/month).",
      batch: "se", status: "Not emailed yet", emailFollowUp: null,
      emailSubject: <subject>, addedAt: <ISO now>}
     ```
     Leads written here appear on Charlie's Applicants list.
   - `set pitches/<slug>`: `{to: email, name, subject, body, status: "queued", batch: "se", createdAt: <ISO now>}`. This puts them in the list to email.
   - An `agentlog` entry: `{agent: "quill", text: "Found <n> new leads: <names>", clientId: "", to: ""}`.
4. **Outreach Tracker sheet** (node 0121f4f7-b496, project 5ea272ad-57b5-4c1d-ad8d-5bb4a0ba2ea7, sheet "Outreach"): append one row per lead after the last filled row:
   `[name, "Not sent yet", email, null×6, "Website £200 + £25/mo", "Auto intro email", null, {date: today}, trade, town, "Preview: charliebouchard-png.github.io/t00cool2clip-media/<slug>/"]`
5. **Call Tracker sheet** (node f624d4de-91e5, project 9b7a9790-e04e-4c46-a522-6a86da20eb25, sheet "Calls"): append one row per lead:
   `[name, owner, phone, "To call", null, =IF(E<n>="","",E<n>+7), =IF(E<n>="","",E<n>+14), =IF(E<n>="","",E<n>+21), null, trade, town, email, preview url, where the owner name came from, "SE website pitch"]`
   Then extend the Status dropdown (ddn_3evjm5bpf4.0) to the new rows.
6. **Commit the repo** so the next run knows who's been checked: `leads/prospects.jsonl`, `leads/rejected.txt`, `leads/tracked.txt`. Commit, `git pull --rebase`, then push to main.

## Finish

- Set `agents/quill` to idle.
- Send Charlie one PushNotification inside `<routine_summary>`: "Found <n> new leads (<trades>). They're on your Applicants list, ready to send with the Send emails button."
- **Rules:**
  - Be honest. Never claim Charlie visited a business or used its site.
  - Never mention his employer.
  - Never email anyone in this run.
