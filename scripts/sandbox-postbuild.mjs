// Post-build step for the static here.now sandbox (see vite.sandbox.config.ts).
// Adds to every HTML page a fetch guard: calls to /_serverFn/ and /api/ get a
// 503 "unavailable" answer.
//     A static host would otherwise answer them with the SPA shell (HTTP 200), which the
//     app parses as a malformed user and crashes on. The backend is unavailable in the
//     sandbox and is not simulated.
// Usage: node scripts/sandbox-postbuild.mjs <dir>
import fs from "node:fs";
import path from "node:path";

const [dir, ...extra] = process.argv.slice(2);
if (!dir || extra.length > 0) {
  console.error("usage: sandbox-postbuild.mjs <dir>");
  process.exit(1);
}
const guard = `(function(f){window.fetch=function(u,o){var s=typeof u==="string"?u:(u&&u.url)||"";if(s.indexOf("/_serverFn/")>-1||s.indexOf("/api/")>-1)return Promise.resolve(new Response(JSON.stringify({error:"Backend unavailable in the static sandbox"}),{status:503,headers:{"content-type":"application/json"}}));return f.apply(this,arguments);};})(window.fetch);`;
const body = guard;
try {
  new Function(body); // refuse to write a snippet that does not parse
} catch (error) {
  console.error(
    "sandbox-postbuild: generated script does not parse:",
    error.message,
  );
  process.exit(1);
}
const tag = `<script>${body}</script>`;

let count = 0;
(function walk(d) {
  for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) {
      const html = fs.readFileSync(full, "utf8");
      if (html.includes("</head>") && !html.includes(tag)) {
        fs.writeFileSync(full, html.replace("</head>", tag + "</head>"));
        count++;
      }
    }
  }
})(dir);
console.log(`Injected static-backend guard into ${count} HTML files`);
