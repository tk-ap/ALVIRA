import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { getSessionByToken, getUserById } from "~/db";
import {
  normalizeInterviewLabInput,
  runInterviewLabTurn,
  type InterviewLabPromptVersion,
} from "~/lib/interview-lab.server";

export type { InterviewLabPromptVersion };

const SESSION_COOKIE = "alvira_session";

async function requireOwner(): Promise<void> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) throw new Error("Owner access required.");

  const session = await getSessionByToken(token);
  if (!session || new Date(session.expires_at) < new Date()) {
    throw new Error("Owner access required.");
  }

  const user = await getUserById(session.user_id);
  if (!user) throw new Error("Owner access required.");

  const ownerEmail = (process.env.ALVIRA_OWNER_EMAIL ?? "tahlia.ashwood@gmail.com")
    .trim()
    .toLowerCase();

  if (user.email.trim().toLowerCase() !== ownerEmail) {
    throw new Error("Owner access required.");
  }
}

export const generateInterviewLabTurn = createServerFn({ method: "POST" })
  .validator(normalizeInterviewLabInput)
  .handler(async ({ data }) => {
    await requireOwner();
    return runInterviewLabTurn(data);
  });
