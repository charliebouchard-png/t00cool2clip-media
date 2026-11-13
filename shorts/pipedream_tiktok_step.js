// Pipedream: replace the code in the TikTok step (between upload_file and upload_video) with this.
// After pasting, click "Connect account" on the google_drive prop (use the same Google account as upload_file), then Deploy.
// It posts to TikTok via Buffer unless the request says skip_tiktok=1,
// and stops the workflow before the YouTube upload when the request says skip_youtube=1.
//
// Fix (13 Nov 2026): the previous version gave Buffer `ev.body.raw_body_url` (Pipedream's temporary
// upload URL), which Buffer can't use as a video, so TikTok posts silently failed while the HTTP call
// still returned 200. This version does what the original working publish step did: make the Google Drive
// copy (from upload_file) viewable by link and give Buffer the direct Drive download URL.
export default defineComponent({
  props: {
    google_drive: { type: "app", app: "google_drive" },
  },
  async run({ steps, $ }) {
    const ev = steps.trigger.event;
    const q = ev.query || {};
    let result = { tiktok: "skipped" };
    if (q.skip_tiktok !== "1") {
      // 1. Public link to the Drive copy made by upload_file (Buffer needs a URL it can download).
      const fileId = steps.upload_file.$return_value.id;
      const g = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.google_drive.$auth.oauth_access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "reader", type: "anyone" }),
      });
      if (!g.ok) throw new Error("Drive share failed: " + (await g.text()));
      const videoUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;

      // 2. Post to TikTok via Buffer.
      const gql = async (query, variables = {}) => {
        const r = await fetch("https://api.buffer.com", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.BUFFER_API_KEY}` },
          body: JSON.stringify({ query, variables }),
        });
        const j = await r.json();
        if (j.errors) throw new Error(JSON.stringify(j.errors));
        return j.data;
      };
      const org = await gql(`query { account { organizations { id } } }`);
      const ch = await gql(
        `query($o: OrganizationId!) { channels(input: { organizationId: $o }) { id name service } }`,
        { o: org.account.organizations[0].id }
      );
      const tiktok = ch.channels.find((c) => c.service === "tiktok");
      if (!tiktok) throw new Error("No TikTok channel found in Buffer");
      const res = await gql(
        `mutation($i: CreatePostInput!) { createPost(input: $i) {
          ... on PostActionSuccess { post { id } }
          ... on MutationError { message } } }`,
        { i: { channelId: tiktok.id, text: q.tiktok_caption || q.title, schedulingType: "automatic", mode: "shareNow",
               assets: [{ video: { url: videoUrl } }] } }
      );
      if (res.createPost.message) throw new Error(res.createPost.message);
      result = { tiktok: res.createPost.post.id, videoUrl };
    }
    if (q.skip_youtube === "1") return $.flow.exit("TikTok only — YouTube skipped");
    return result;
  },
});
