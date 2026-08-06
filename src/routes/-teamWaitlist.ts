// ── Team waitlist server function ──
// S1 Team waitlist. Stores submissions in SQLite and queues a confirmation
// email to the submitter plus a notification to hello@alvira.ai via the
// file-based email bridge (same pattern as -auth.ts welcome emails).

import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { insertTeamWaitlistEntry } from "~/db";

const TEAM_SIZES = ["5–10", "11–25", "26–50", "51–100", "100+"] as const;

export interface TeamWaitlistInput {
  name: string;
  email: string;
  company: string;
  teamSize: string;
  useCase: string;
}

const EMAIL_QUEUE_PATH = join("/home", "team", "shared", "pending-team-waitlist-emails.txt");

export const joinTeamWaitlist = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as Partial<TeamWaitlistInput>;
    if (!d.name || typeof d.name !== "string" || !d.name.trim()) {
      throw new Error("Please enter your full name.");
    }
    if (!d.email || typeof d.email !== "string" || !d.email.includes("@")) {
      throw new Error("Please enter a valid work email.");
    }
    const teamSize = d.teamSize || "";
    if (teamSize && !(TEAM_SIZES as readonly string[]).includes(teamSize)) {
      throw new Error("Please choose a team size from the list.");
    }
    return {
      name: d.name.trim().slice(0, 200),
      email: d.email.trim().toLowerCase().slice(0, 254),
      company: (typeof d.company === "string" ? d.company.trim() : "").slice(0, 200),
      teamSize,
      useCase: (typeof d.useCase === "string" ? d.useCase.trim() : "").slice(0, 2000),
    };
  })
  .handler(async ({ data }) => {
    insertTeamWaitlistEntry({
      name: data.name,
      email: data.email,
      company: data.company || null,
      team_size: data.teamSize || null,
      use_case: data.useCase || null,
    });

    const timestamp = new Date().toISOString();

    // Queue confirmation to the submitter.
    appendFileSync(
      EMAIL_QUEUE_PATH,
      JSON.stringify({
        to: data.email,
        subject: "You're on the ALVIRA Team waitlist",
        body: `Hi ${data.name}, you're on the list. We'll reach out when the ALVIRA Team tier is ready for early access.`,
        timestamp,
      }) + "\n",
    );

    // Queue notification to hello@alvira.ai.
    appendFileSync(
      EMAIL_QUEUE_PATH,
      JSON.stringify({
        to: "hello@alvira.ai",
        subject: `Team waitlist signup: ${data.name}${data.company ? ` (${data.company})` : ""}`,
        body: `New team waitlist submission:\n\nName: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company || "(not provided)"}\nTeam size: ${data.teamSize || "(not provided)"}\nUse case: ${data.useCase || "(not provided)"}`,
        timestamp,
      }) + "\n",
    );

    return { ok: true };
  });
