// Fail closed before a permanent here.now publish if the complete canonical
// sandbox was not generated. HTTP 200 is insufficient on static hosts because
// an SPA fallback can make a missing route look healthy.
import fs from "node:fs";
import path from "node:path";

const [dir] = process.argv.slice(2);
if (!dir || process.argv.length !== 3) {
  console.error("usage: sandbox-verify.mjs <dist-client-dir>");
  process.exit(1);
}

const requiredPages = [
  { route: "/", file: "index.html", markers: ["ALVIRA"] },
  {
    route: "/app/",
    file: "app/index.html",
    markers: ["Static Context sandbox"],
  },
  { route: "/context/", file: "context/index.html", markers: ["Context"] },
  {
    route: "/bridge/connect/",
    file: "bridge/connect/index.html",
    markers: ["Static Connect sandbox"],
  },
  {
    route: "/meos/",
    file: "meos/index.html",
    markers: ["Static Reflect sandbox"],
  },
  {
    route: "/lab/interview/",
    file: "lab/interview/index.html",
    markers: ["Interview Engine Lab", "Static product sandbox"],
  },
  {
    route: "/variants/interview-shell/",
    file: "variants/interview-shell/index.html",
    markers: ["/lab/interview/", "Legacy Interview Shell route"],
  },
];

const guardMarker = "Backend unavailable in the static sandbox";
const failures = [];
for (const page of requiredPages) {
  const target = path.join(dir, page.file);
  if (!fs.existsSync(target)) {
    failures.push(`${page.route}: generated page is missing (${page.file})`);
    continue;
  }
  const html = fs.readFileSync(target, "utf8");
  for (const marker of [...page.markers, guardMarker]) {
    if (!html.includes(marker))
      failures.push(`${page.route}: missing marker ${JSON.stringify(marker)}`);
  }
}

if (failures.length > 0) {
  console.error("Canonical sandbox verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Canonical sandbox route inventory verified:");
for (const page of requiredPages) console.log(`- ${page.route}`);
