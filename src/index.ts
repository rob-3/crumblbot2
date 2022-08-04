import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
}

export default {
  async fetch(
    request: Request,
    env: any,
  ): Promise<Response> {

    // Your public key can be found on your application in the Developer Portal
    const PUBLIC_KEY =
      "ed1c4e1eb883faf4e47c3602de8943aef915cdc1e67ecc415815241d38f29a05";

    const signature = request.headers.get("X-Signature-Ed25519")!;
    const timestamp = request.headers.get("X-Signature-Timestamp")!;
    const rawBody = await request.clone().text(); // rawBody is expected to be a string, not raw bytes

    const isVerified = verifyKey(rawBody, signature, timestamp, PUBLIC_KEY);

    if (!isVerified) {
      return new Response(null, {
        status: 401,
        statusText: "invalid request signature",
      });
    }

    const body = JSON.parse(rawBody);

    if (body.type === InteractionType.PING) {
      return new Response(
        JSON.stringify({
          type: InteractionResponseType.PONG,
        })
      );
    }

    const cookiesData = await env["crumbl-api"]
      .fetch(request)
      .then((x: any) => x.json());

    return new Response(
      JSON.stringify({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Here are the weekly specialty cookies!",
          embeds: cookiesData.map(({ name, description, image }: any) => ({
            title: name,
            description,
            thumbnail: {
              url: `https://crumbl.video/cdn-cgi/image/width=3840,quality=80/${image}`
            },
          })),
        },
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }
    );
  },
};
