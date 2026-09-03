import { Pool } from "@neondatabase/serverless";
import { sendEmail } from "../src/email";

const SEND = process.argv.includes("--send");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = Math.max(1, Math.min(50, Number(limitArg?.split("=")[1] ?? 10) || 10));
const siteUrl = (process.env.PUBLIC_SITE_URL || "https://alviratech.vercel.app").replace(/\/$/, "");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error("DATABASE_URL is required.");
if (SEND && !process.env.AGENTMAIL_API_KEY?.trim()) {
  throw new Error("AGENTMAIL_API_KEY is required with --send. Dry-run does not require it.");
}

const pool = new Pool({ connectionString });
const client = await pool.connect();

try {
  const result = await client.query(
    `SELECT email, source, reserved_at
       FROM founding_beta_reservations
      WHERE claimed_at IS NULL
        AND revoked_at IS NULL
        AND invite_sent_at IS NULL
      ORDER BY reserved_at ASC
      LIMIT $1`,
    [limit],
  );

  if (result.rows.length === 0) {
    console.log("No Founding Beta reservations are ready for invitation.");
    process.exitCode = 0;
  }

  for (const row of result.rows as Array<{ email: string; source: string; reserved_at: string }>) {
    const subject = "Your ALVIRA Founding Beta access is ready";
    const text = `Hi there,\n\nYou previously received a reserved place in ALVIRA's Founding Beta. The interface is ready for you to create your account and use your reserved complimentary access.\n\nCreate your account with this same email address at:\n${siteUrl}/signup\n\nYour Founding Beta entitlement will be applied automatically when you sign up.\n\nIf you no longer want this reserved place, just reply and let us know.\n\n— ALVIRA`;

    if (!SEND) {
      console.log(`[DRY RUN] ${row.email} (${row.source}) -> ${subject}`);
      continue;
    }

    const receipt = await sendEmail({
      to: row.email,
      subject,
      text,
      replyTo: "alvira@agentmail.to",
    });

    if (receipt.provider !== "agentmail") {
      throw new Error(`Expected AgentMail delivery for ${row.email}; got ${receipt.provider}.`);
    }

    await client.query(
      `UPDATE founding_beta_reservations
          SET invite_sent_at = NOW(),
              invite_message_id = $2
        WHERE email = $1
          AND invite_sent_at IS NULL
          AND claimed_at IS NULL
          AND revoked_at IS NULL`,
      [row.email, receipt.messageId ?? null],
    );

    console.log(`SENT ${row.email} message=${receipt.messageId ?? "unknown"}`);
  }
} finally {
  client.release();
  await pool.end();
}
