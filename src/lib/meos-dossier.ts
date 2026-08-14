import { jsPDF } from "jspdf";
import type { MeosBuilderKitInput } from "./meos-builder-kit";

export type MeosDossierInput = MeosBuilderKitInput & { password: string };

export function createEncryptedMeosDossier(input: MeosDossierInput): Blob {
  if (input.password.length < 10)
    throw new Error("Use a password with at least 10 characters.");
  const pdf = new jsPDF({
    unit: "pt",
    format: "letter",
    encryption: {
      userPassword: input.password,
      ownerPassword: `${input.password}:${crypto.randomUUID()}`,
      userPermissions: ["print"],
    },
  });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 54;
  let y = margin;

  const page = () => {
    pdf.addPage();
    y = margin;
  };
  const write = (
    text: string,
    size = 11,
    color: [number, number, number] = [45, 55, 52],
  ) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(
      text || "Not yet defined.",
      width - margin * 2,
    ) as string[];
    const lineHeight = size * 1.55;
    for (const line of lines) {
      if (y + lineHeight > height - margin) page();
      pdf.text(line, margin, y);
      y += lineHeight;
    }
    y += size * 0.8;
  };
  const heading = (text: string) => {
    if (y > height - 120) page();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(17, 94, 89);
    pdf.text(text, margin, y);
    y += 26;
  };

  pdf.setProperties({
    title: `${input.topic} — MeOS Encrypted Dossier`,
    subject: "Private personal operating system",
    author: "ALVIRA",
  });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(17, 94, 89);
  pdf.text("ALVIRA / MeOS", margin, y);
  y += 34;
  pdf.setFontSize(27);
  pdf.setTextColor(20, 28, 26);
  pdf.text(input.topic, margin, y);
  y += 34;
  write("Encrypted Dossier", 16, [17, 94, 89]);
  write(
    "Private personal material. Store the password separately and share this file only with people or agents you trust.",
    10,
    [90, 100, 96],
  );

  const portrait = (input.portrait ?? {}) as Record<string, unknown>;
  const sections: Array<[string, string]> = [
    ["Integrated portrait", String(portrait.portrait ?? "Not yet compiled.")],
    [
      "Personal purpose",
      String(
        (portrait.purposeStatements as Record<string, unknown> | undefined)
          ?.personal ?? "Not yet defined.",
      ),
    ],
    [
      "Professional purpose",
      String(
        (portrait.purposeStatements as Record<string, unknown> | undefined)
          ?.professional ?? "Not yet defined.",
      ),
    ],
    [
      "Decision compass",
      String(portrait.decisionCompass ?? "Not yet defined."),
    ],
    ["Daily alignment", String(portrait.dailyAlignment ?? "Not yet defined.")],
    ["Cycles and progression", String(portrait.cycles ?? "Not yet defined.")],
  ];
  for (const [title, body] of sections) {
    heading(title);
    write(body);
  }
  heading("Source material");
  for (const [name, content] of Object.entries(input.content).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    heading(name.replace(/\.md$/i, "").replace(/[-_]/g, " "));
    write(content.replace(/^#{1,6}\s+/gm, "").replace(/\*\*/g, ""));
  }
  page();
  heading("Privacy and use");
  write(
    "This dossier contains owner-provided and owner-reviewed material. Optional symbolic frameworks are reflective lenses, not scientific, diagnostic, predictive, or deterministic claims. Your choices remain your own.",
  );
  write(
    `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.`,
    9,
    [90, 100, 96],
  );
  return pdf.output("blob");
}
