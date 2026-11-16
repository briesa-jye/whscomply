import { connection } from "next/server";

// Read the key per request. Without this the answer is fixed when the site is built.
export async function GET() {
  await connection();
  return Response.json({
    configured: !!(
      process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
    ),
  });
}
