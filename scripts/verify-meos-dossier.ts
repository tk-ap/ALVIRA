import { mkdir, writeFile } from "node:fs/promises";
import { createEncryptedMeosDossier } from "../src/lib/meos-dossier";

const output = new URL(
  "../tmp/pdfs/meos-dossier-verification.pdf",
  import.meta.url,
);
await mkdir(new URL("../tmp/pdfs/", import.meta.url), { recursive: true });
const blob = createEncryptedMeosDossier({
  topic: "Verification Profile",
  password: "alvira-test-password",
  portrait: {
    portrait:
      "A grounded portrait created to verify ALVIRA's encrypted dossier layout.",
    purposeStatements: {
      personal: "Act with care and clarity.",
      professional: "Build durable, useful systems.",
    },
    decisionCompass: "Does this preserve agency, privacy, and truth?",
    dailyAlignment: "Choose one durable action.",
    cycles: "Review progress without forcing certainty.",
  },
  interviewState: {},
  content: {
    "source-notes.md":
      "# Source notes\n\nOwner-reviewed evidence remains distinct from agent synthesis.",
  },
});
await writeFile(output, new Uint8Array(await blob.arrayBuffer()));
console.log(output.pathname);
