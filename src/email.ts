interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

const AGENTMAIL_API_URL = "https://api.agentmail.to/v0/inboxes/alvira@agentmail.to/messages/send";

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.AGENTMAIL_API_KEY;
  if (!apiKey) {
    throw new Error("AgentMail is not configured: AGENTMAIL_API_KEY is missing.");
  }

  const response = await fetch(AGENTMAIL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: message.to,
      subject: message.subject,
      text: message.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`AgentMail delivery failed (${response.status}): ${await response.text()}`);
  }
}

export function sendWelcomeEmail(email: string): Promise<void> {
  return sendEmail({
    to: email,
    subject: "Welcome to ALVIRA",
    text: "Welcome to ALVIRA. Your workspace is ready.",
  });
}

export function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  return sendEmail({
    to: email,
    subject: "Reset your ALVIRA password",
    text: `Reset your password: ${resetUrl}\n\nThis link expires in one hour.`,
  });
}
