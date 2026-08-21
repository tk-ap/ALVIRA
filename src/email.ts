interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const agentMailKey = process.env.AGENTMAIL_API_KEY?.trim();
  const agentMailFrom = process.env.AGENTMAIL_FROM?.trim();
  const configuredAgentMailUrl = process.env.AGENTMAIL_API_URL?.trim();

  if (agentMailKey && agentMailFrom) {
    const inboxId = encodeURIComponent(agentMailFrom);
    const rawBaseUrl = configuredAgentMailUrl || "https://api.agentmail.to/v0";
    const baseUrl = /\/v0\/?$|\/messages\/send\/?$|\{inbox_id\}/.test(rawBaseUrl)
      ? rawBaseUrl
      : `${rawBaseUrl.replace(/\/$/, "")}/v0`;
    const agentMailUrl = baseUrl.includes("{inbox_id}")
      ? baseUrl.replace("{inbox_id}", inboxId)
      : /\/messages\/send\/?$/.test(baseUrl)
        ? baseUrl
        : `${baseUrl.replace(/\/$/, "")}/inboxes/${inboxId}/messages/send`;

    const response = await fetch(agentMailUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${agentMailKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: message.to,
        subject: message.subject,
        text: message.text,
      }),
    });
    if (!response.ok) {
      console.error(
        `AgentMail delivery failed (${response.status}): ${await response.text()}`,
      );
    }
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn(
      `Email skipped (${message.subject}): configure AgentMail or Resend credentials.`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text }),
  });
  if (!response.ok) {
    console.error(`Email delivery failed (${response.status}): ${await response.text()}`);
  }
}

export function sendWelcomeEmail(email: string): Promise<void> {
  return sendEmail({ to: email, subject: "Welcome to ALVIRA", text: "Welcome to ALVIRA. Your workspace is ready." });
}

export function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  return sendEmail({ to: email, subject: "Reset your ALVIRA password", text: `Reset your password: ${resetUrl}\n\nThis link expires in one hour.` });
}
