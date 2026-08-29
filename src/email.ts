interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiUrl = process.env.AGENTMAIL_API_URL || process.env.EMAIL_API_URL;
  const apiKey = process.env.AGENTMAIL_API_KEY;
  const from = process.env.AGENTMAIL_FROM || process.env.EMAIL_FROM;

  if (!apiUrl || !apiKey || !from) {
    console.warn(
      `Email skipped (${message.subject}): configure AGENTMAIL_API_URL, AGENTMAIL_API_KEY, and AGENTMAIL_FROM.`,
    );
    return;
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      ...(message.replyTo ? { reply_to: [message.replyTo] } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Email delivery failed (${response.status}): ${await response.text()}`,
    );
  }
}

export function sendWelcomeEmail(email: string): Promise<void> {
  return sendEmail({
    to: email,
    subject: "Welcome to ALVIRA",
    text: "Welcome to ALVIRA. Your workspace is ready.",
  });
}

export function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  return sendEmail({
    to: email,
    subject: "Reset your ALVIRA password",
    text: `Reset your password: ${resetUrl}\n\nThis link expires in one hour.`,
  });
}
