# Agent Quill – sending pitch emails (only when Charlie presses "Send emails")

Charlie presses the **Send emails** button in Client Files. That run sends the next batch of queued website pitches, then carries on with Quill's normal inbox work: replies, follow-ups and drafts.

## Where the pitches are

- **The app:** https://claude.ai/artifact/UuRFwL8Vhx5sPsgQmY8rWi. Use the ArtifactData tool, loaded with ToolSearch "select:ArtifactData".
- **Pitches:** collection `pitches`, doc id = client id (slug). Each doc is `{to, name, subject, body, status: "queued"|"sending"|"sent"|"skipped", sentAt, messageId}`.
- **Applicant files:** applicants come from clients.json (Artifact read, `path: "clients.json"`) plus collection `leads`, which holds new applicants Quill found. Status and contact edits live in `clients/<id>`.

## Steps

1. **Work out how many to send.** The button's message says how many, e.g. "send 20", or "send all" (every queued pitch). If it doesn't say, send 20. Never send more than the number given.
   - **Split runs:** a message may say "ONLY these ids: a, b, c" – then send only those pitches (still checking each one below), and ignore every other pitch, because other Quill runs are sending the rest at the same time.
   - **"Pitches only":** if the message says so, skip step 8 (the normal inbox run) – another run does it.
2. **Pick the pitches.** `query` pitches where `status == "queued"`, oldest `createdAt` first (or the listed ids).
3. **For each pitch, check it first:**
   - **Edited contact details:** `get clients/<id>`. If it has a `contact` object with an email, send to that email instead. If `contact.email` is `""`, mark the pitch `skipped` and move on.
   - **Status:** if the client's status is anything other than "Not emailed yet" (or the doc is missing), mark the pitch `skipped`. They've already been contacted, archived or won.
   - **Duplicates:** search Gmail sent mail for `to:<email>` with the pitch subject. If it's already been sent, mark the pitch `sent` and move on, so nothing goes out twice.
   - **Preview page:** confirm https://charliebouchard-png.github.io/t00cool2clip-media/<id>/ loads (WebFetch). If it fails, leave the pitch queued, note it, and move on.
4. **Send it.** Set the pitch to `sending`, then send with Gmail `send_message` from charliebouchard208@gmail.com. Use the stored subject and body exactly (plain text). Leave about a minute between emails if your tools allow it.
5. **Record it.** In one ArtifactData `batch`:
   - `update` the pitch to `{status: "sent", sentAt, messageId}`
   - `update` `clients/<id>` to `{status: "Emailed", updatedAt}` (create it with `set` if it doesn't exist)
   - append `{dir: "out", at, to, subject, body: <the FULL email text exactly as sent>}` to `emails/<id>` (get it first and keep existing items). The app shows this full email on the applicant's file.
   - add an `agentlog` entry: `{agent: "quill", text: "Sent the website pitch to <name>", clientId: <id>}`
   - set `agents/quill` to `{state: "working", doing: "Sending pitches – <n> of <total>", updatedAt}`
6. **Update the Outreach Tracker sheet.** It's node 0121f4f7-b496, project 5ea272ad-57b5-4c1d-ad8d-5bb4a0ba2ea7, sheet "Outreach". Find the row whose email matches, then set:
   - B "Emailed"
   - D today
   - K "Follow-up 1 if no reply"
   - L today + 3 days
   - M today

   If no row matches, append one.
7. **Stop early if a send fails** with an authentication, quota or suspension error. Stop at once and send Charlie a PushNotification saying why.
8. **Then do Quill's normal run:** the approval rule, replies, day-3 and day-6 follow-ups, archiving and so on.
9. **In your final summary**, lead with "Sent <n> pitches (<remaining> still queued)".
