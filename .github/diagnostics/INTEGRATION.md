# Markdown generation diagnostics — integration guide

This branch adds small, non-invasive utilities and a client helper to help diagnose why Markdown files are not being created/committed when the "Generate Markdown" action runs.

Files added (diagnostics only)
- src/server/lib/logger.ts — structured JSON logging helper
- src/server/middleware/requestId.ts — Express middleware to add/propagate X-Request-Id
- src/server/diagnostics/markdownDiagnostics.ts — wrapper that logs steps around an existing Markdown-generation handler and returns structured errors
- src/ui/components/GenerateButtonDiagnostics.tsx — minimal drop-in client button which posts to the generation endpoint with an X-Request-Id and surfaces diagnostics in a copyable blob
- tests/integration/markdown-gen.spec.ts — template integration test (Jest) demonstrating expected behavior

How to integrate (server)
1. Register the request id middleware early in your Express app (after any JSON body parser):

```ts
import express from 'express'
import { requestIdMiddleware } from './src/server/middleware/requestId'

const app = express()
app.use(express.json())
app.use(requestIdMiddleware)
```

2. Wrap your existing endpoint handler for the Markdown generator with the wrapper:

```ts
import { wrapMarkdownHandler } from './src/server/diagnostics/markdownDiagnostics'
import originalHandler from './path/to/your/markdownHandler'

app.post('/api/generate-markdown', wrapMarkdownHandler(originalHandler))
```

The wrapper logs handler invocation, arguments shape (not content), success, and errors. On error it returns a JSON object: { error: { code, message, requestId } } and sets `X-Request-Id` on the response for client correlation.

If your handler performs file writes, git commits/pushes, or calls out to the GitHub API, add explicit logging using the `logger` util in those steps:

```ts
import { logger } from './src/server/lib/logger'

logger.info({ requestId, route: '/api/generate-markdown', step: 'write-file', path: filePath })
```

How to integrate (client)
- Replace your existing generate button with the `GenerateButtonDiagnostics` or call the same endpoint with an `X-Request-Id` header. The component will show an alert and offer to copy a diagnostics blob containing server response and requestId.

Testing locally
- If you use Jest, the `tests/integration/markdown-gen.spec.ts` file contains a template test that stubs a failing handler and asserts the response includes an `error` object and `X-Request-Id` header. Adapt it to your test setup.

Notes & safety
- The added code only logs and returns structured errors. It does not change business logic or generation content.
- Avoid logging secrets or tokens. The logger is intentionally simple; mask any sensitive fields before logging.

If you want, I can:
- Attempt to automatically wire these into the app by editing the server entrypoint and swapping the handler (I will only do this if you confirm the handler path or give permission to modify files that may be changed). Currently I did not modify your existing handlers to avoid risky changes.
- Update the client UI directly if you point me to the current Generate button file path.

After you integrate and reproduce the failure once, paste the server log lines around the failure and the client diagnostics blob (or share a screenshot/console dump). I will analyze those logs and propose a fix (e.g., commit/push permissions, GitHub token scope issue, filesystem path mismatch, or exception in generation code).
