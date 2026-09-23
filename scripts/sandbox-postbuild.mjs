// Post-build step for sandbox variants published under a sub-path (see
// vite.sandbox.config.ts, SANDBOX_BASE). The router and assets already honour the
// base; this adds a click handler that rewrites hard-coded root-relative <a href="/x">
// links so they stay inside the variant. Usage: node scripts/sandbox-postbuild.mjs <dir> </variants/name/>
import fs from "node:fs";
import path from "node:path";

const [dir, base] = process.argv.slice(2);
if (!dir || !base || !base.startsWith("/") || !base.endsWith("/")) {
  console.error("usage: sandbox-postbuild.mjs <dir> </base/>");
  process.exit(1);
}
const tag = `<script>(function(b){document.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest("a[href^='/']");if(!a)return;var h=a.getAttribute("href");if(h.indexOf("//")===0||h.indexOf(b)===0)return;a.setAttribute("href",b+h.slice(1));},true);})(${JSON.stringify(base)});</script>`;

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
console.log(`Injected link rewriter into ${count} HTML files for ${base}`);
