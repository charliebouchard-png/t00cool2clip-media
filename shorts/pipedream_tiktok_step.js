// Pipedream: replace the code in the TikTok step (between upload_file and upload_video) with this.
// It posts to TikTok via Buffer unless the request says skip_tiktok=1,
// and stops the workflow before the YouTube upload when the request says skip_youtube=1.
export default defineComponent({
  async run({ steps, $ }) {
    const ev = steps.trigger.event;
    const q = ev.query || {};
    let result = { tiktok: "skipped" };
    if (q.skip_tiktok !== "1") {
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
               assets: [{ video: { url: ev.body.raw_body_url } }] } }
      );
      if (res.createPost.message) throw new Error(res.createPost.message);
      result = { tiktok: res.createPost.post.id };
    }
    if (q.skip_youtube === "1") return $.flow.exit("TikTok only — YouTube skipped");
    return result;
  },
});
