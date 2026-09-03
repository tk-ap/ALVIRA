export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export interface EmailDeliveryReceipt {
  provider: "agentmail" | "generic" | "skipped";
  messageId?: string;
  threadId?: string;
}

const AGENTMAIL_BASE_URL = "https://api.agentmail.to/v0";

export function buildAgentMailSendUrl(inboxId: string): string {
  return `${AGENTMAIL_BASE_URL}/inboxes/${encodeURIComponent(inboxId.trim())}/messages/send`;
}

export async function sendEmail(message: EmailMessage): Promise<EmailDeliveryReceipt> {
  const agentMailApiKey = process.env.AGENTMAIL_API_KEY?.trim();
  const agentMailInboxId = (process.env.AGENTMAIL_INBOX_ID || "alvira@agentmail.to").trim();

  if (agentMailApiKey && agentMailInboxId) {
    const response = await fetch(buildAgentMailSendUrl(agentMailInboxId), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${agentMailApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(`AgentMail delivery failed (${response.status}): ${await response.text()}`);
    }

    const result = (await response.json()) as { message_id?: string; thread_id?: string };
    return {
      provider: "agentmail",
      messageId: result.message_id,
      threadId: result.thread_id,
    };
  }

  // Backward-compatible generic provider fallback for non-AgentMail environments.
  const apiUrl = process.env.EMAIL_API_URL?.trim();
  const apiKey = process.env.EMAIL_API_KEY?.trim() || process.env.RESEND_API_KEY?.trim();
  const from = (process.env.EMAIL_FROM || process.env.AGENTMAIL_FROM)?.trim();

  if (!apiUrl || !from) {
    console.warn(
      `Email skipped (${message.subject}): configure AGENTMAIL_API_KEY (preferred) or EMAIL_API_URL/EMAIL_FROM.`,
    );
    return { provider: "skipped" };
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      ...(message.replyTo ? { reply_to: [message.replyTo] } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Email delivery failed (${response.status}): ${await response.text()}`);
  }

  return { provider: "generic" };
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Welcome to ALVIRA",
    text: "Welcome to ALVIRA. Your workspace is ready.",
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Reset your ALVIRA password",
    text: `Reset your password: ${resetUrl}\n\nThis link expires in one hour.`,
  });
}
