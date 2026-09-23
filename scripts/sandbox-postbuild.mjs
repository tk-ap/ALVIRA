// Post-build step for the static here.now sandbox (see vite.sandbox.config.ts).
// Adds to every HTML page:
//  1. A fetch guard: calls to /_serverFn/ and /api/ get a 503 "unavailable" answer.
//     A static host would otherwise answer them with the SPA shell (HTTP 200), which the
//     app parses as a malformed user and crashes on. The backend is unavailable in the
//     sandbox and is not simulated.
//  2. For a variant served under a sub-path, a click handler that rewrites hard-coded
//     root-relative <a href="/x"> links so they stay inside the variant.
// Usage: node scripts/sandbox-postbuild.mjs <dir> [/variants/name/]
import fs from "node:fs";
import path from "node:path";

const [dir, base] = process.argv.slice(2);
if (!dir || (base && (!base.startsWith("/") || !base.endsWith("/")))) {
  console.error("usage: sandbox-postbuild.mjs <dir> [/base/]");
  process.exit(1);
}
const guard = `(function(f){window.fetch=function(u,o){var s=typeof u==="string"?u:(u&&u.url)||"";if(/\/_serverFn\/|\/api\//.test(s))return Promise.resolve(new Response(JSON.stringify({error:"Backend unavailable in the static sandbox"}),{status:503,headers:{"content-type":"application/json"}}));return f.apply(this,arguments);};})(window.fetch);`;
const rewriter = base && base !== "/"
  ? `(function(b){document.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest("a[href^='/']");if(!a)return;var h=a.getAttribute("href");if(h.indexOf("//")===0||h.indexOf(b)===0)return;a.setAttribute("href",b+h.slice(1));},true);})(${JSON.stringify(base)});`
  : "";
const tag = `<script>${guard}${rewriter}</script>`;

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
console.log(`Injected sandbox script into ${count} HTML files (${base || "/"})`);
