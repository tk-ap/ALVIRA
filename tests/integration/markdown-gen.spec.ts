// tests/integration/markdown-gen.spec.ts
// Template integration test — adapt to your test runner

import request from 'supertest'
import express from 'express'
import { requestIdMiddleware } from '../../src/server/middleware/requestId'
import { wrapMarkdownHandler } from '../../src/server/diagnostics/markdownDiagnostics'

const app = express()
app.use(express.json())
app.use(requestIdMiddleware)

// a failing handler to simulate an error in generation
const failingHandler = (req: any, res: any) => {
  throw new Error('Simulated generation failure')
}

app.post('/api/generate-markdown', wrapMarkdownHandler(failingHandler))

describe('Markdown diagnostics', () => {
  it('returns structured error and X-Request-Id when generation fails', async () => {
    const res = await request(app)
      .post('/api/generate-markdown')
      .send({ foo: 'bar' })
      .set('Accept', 'application/json')

    expect(res.headers['x-request-id']).toBeDefined()
    expect(res.status).toBe(500)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toHaveProperty('requestId')
  })
})
