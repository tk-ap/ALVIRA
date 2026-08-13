interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn(`Email skipped (${message.subject}): configure RESEND_API_KEY and EMAIL_FROM.`);
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
