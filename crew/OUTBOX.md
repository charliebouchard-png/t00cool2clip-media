# The outbox: Charlie approves every email to someone who has said yes

Charlie's rule: **before any email goes to a client who has accepted us, he must see a draft first.**

"Accepted" means any business that has:
- replied positively (yes to the mock-up or clips, sent footage, asked about prices, is negotiating, or agreed a deal), or
- is a won client.

This covers replies to them, deliveries, requests for footage or information, change confirmations, and anything else you would send them.

These emails can still go out without approval:
- cold pitches,
- no-reply follow-ups to people who never replied,
- the one polite "why not?" reply to a "not interested",
- the final "no problem, thanks" to someone who said no again,
- check-ins someone asked for ("try me in January").

## Drafting (instead of sending)

1. **Write the email** exactly as you would have sent it, in Charlie's voice.
2. **Save it as a Gmail draft** with `mcp__Gmail__create_draft` (in their thread if the tool allows). Keep the draft id.
3. **Add it to the outbox.** In the Client Files app (https://claude.ai/artifact/UuRFwL8Vhx5sPsgQmY8rWi, ArtifactData tool), `set` collection `outbox`, doc_id `o<unix ms>`:
   ```
   {"status":"pending","by":"quill"|"pidge","clientId":<id>,"to":<email>,
    "subject":<subject>,"body":<full plain-text body>,"threadId":<Gmail thread id or "">,
    "gmailDraftId":<draft id>,"kind":"reply"|"delivery"|"ask"|"changes"|"other",
    "why":<one line for Charlie, e.g. "They said yes to the free mock-up">,
    "buildId":<client id, for deliveries/asks>,"createdAt":<ISO now>,"updatedAt":<ISO now>}
   ```
4. **Log it.** Add an `agentlog` entry: `{agent, at, text: "Drafted <what> to <name> – waiting for Charlie's OK", clientId, to: ""}`.
5. **Don't draft the same email twice.** If a `pending` outbox doc already exists for that client and purpose, update it instead.
6. **Tell Charlie once per run.** At the end of the run, if you drafted anything, send one PushNotification wrapped in `<routine_summary>`: "<n> email(s) waiting for your OK: <names>. Open Client Files › Agents to read, edit and approve."

## Sending what Charlie approved (start of every run)

1. `query` outbox where `status == "approved"` and `by == <you>`.
2. **Check Charlie hasn't already sent it.** Search Gmail sent mail for an email to `to` with the same subject sent after `createdAt`.
   - If you find one, set `{status: "sent", sentAt, note: "Charlie sent it himself"}`, delete the Gmail draft, and move on.
3. **Otherwise, send it.** Use the outbox doc's `subject` and `body` exactly. Charlie may have edited them in the app, and the app version wins.
   - If there is a `threadId`, reply in that thread; if not, send a new email.
   - Then delete the Gmail draft (`mcp__Gmail__delete_draft`).
4. **Record the send.**
   - `update` the outbox doc: `{status: "sent", sentAt, messageId, updatedAt}`.
   - Append the email to `emails/<clientId>`.
   - Add an `agentlog` entry: "Sent <what> to <name>".
5. **Also check pending emails.** If an email is still `pending` but Gmail sent mail shows Charlie already sent it from his drafts, mark it `sent` with `note: "Charlie sent it from Gmail"`.
6. **Rejected emails.** For each doc with `status: "rejected"` that still has a `gmailDraftId`: delete that Gmail draft, then remove the field by updating it to `{"__delete__": true}`. Send nothing.
7. **Never send an outbox email that isn't `approved`.** Never send one twice.

**Edited contact details:** Charlie can edit a client's details in the app. If `clients/<id>` has a `contact` object, its fields (name, owner, phone, email, address, website) replace the values from clients.json. Always use them, especially `contact.email` as the address to send to.
