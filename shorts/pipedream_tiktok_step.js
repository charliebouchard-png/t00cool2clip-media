// Pipedream: the "code" step (between upload_file and upload_video). Paste this in, then pick
// your Google Drive account in the step's CONFIGURATION, then Deploy.
// Fix 13 Nov 2026: Buffer can't read Pipedream's raw_body_url ("Video could not be read from its URL"),
// so (like the original working step) we make the Drive copy public and give Buffer the Drive link.
// Posts to TikTok via Buffer unless skip_tiktok=1; stops before the YouTube upload when skip_youtube=1.
export default defineComponent({
  props: {
    google_drive: { type: "app", app: "google_drive" },
  },
  async run({ steps, $ }) {
    const q = steps.trigger.event.query || {};
    let result = { tiktok: "skipped" };
    if (q.skip_tiktok !== "1") {
      const fileId = steps.upload_file.$return_value.id;
      const g = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.google_drive.$auth.oauth_access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: "reader", type: "anyone" }),
      });
      if (!g.ok) throw new Error("Drive share failed: " + (await g.text()));
      const videoUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
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
      if (res.createPost.message) throw new Error(res.createPost.message + " (video URL: " + videoUrl + ")");
      result = { tiktok: res.createPost.post.id, videoUrl };
    }
    if (q.skip_youtube === "1") return $.flow.exit("TikTok only — YouTube skipped");
    return result;
  },
});
