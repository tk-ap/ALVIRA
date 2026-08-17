// src/server/diagnostics/markdownDiagnostics.ts
import { Request, Response, NextFunction, RequestHandler } from 'express'
import { logger } from '../lib/logger'

export function wrapMarkdownHandler(handler: RequestHandler): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    const requestId = (req as any).requestId || res.getHeader('X-Request-Id') || `${Date.now()}-${Math.random()}`
    const route = req.path

    const logStep = (step: string, extra: Record<string, any> = {}) => {
      logger.info({ requestId, route, step, ...extra })
    }

    const logError = (step: string, err: any) => {
      logger.error({ requestId, route, step, error: err && (err.stack || err.message || String(err)) })
    }

    try {
      logStep('handler-invoked', { bodyShape: describeShape(req.body) })

      // Optionally capture generation specifics via events that the real handler can call
      // If the handler writes files / commits, it should call logger.info with step names 'write-file', 'git-commit', etc.

      await new Promise<void>((resolve, reject) => {
        // If handler expects typical (req,res,next) callback style, we intercept the final send to log
        let finished = false
        const originalSend = res.send.bind(res)
        const originalJson = res.json.bind(res)

        function wrapSend(fn: Function) {
          return function (body: any) {
            if (!finished) {
              finished = true
              logStep('handler-success', { status: res.statusCode })
            }
            return fn(body)
          }
        }

        // @ts-ignore
        res.send = wrapSend(originalSend)
        // @ts-ignore
        res.json = wrapSend(originalJson)

        try {
          const maybePromise = handler(req, res, (err?: any) => {
            if (err) return reject(err)
            // If handler used next() to continue, consider it success here
            if (!finished) {
              finished = true
              logStep('handler-next-called', { status: res.statusCode })
            }
            resolve()
          })

          if (maybePromise && typeof (maybePromise as any).then === 'function') {
            ;(maybePromise as any).then(() => resolve()).catch((err: any) => reject(err))
          }
        } catch (err) {
          reject(err)
        }
      })

      // If the handler already sent a response, we don't interfere further
    } catch (err) {
      // Log & return structured error
      logError('handler-error', err)
      const code = err && (err.code || 'internal_error')
      const message = err && (err.message || 'Internal server error')
      // Try to avoid leaking PII; message should be safe, but teams can change this
      if (!res.headersSent) {
        res.status((err && err.status) || 500).json({ error: { code, message, requestId } })
      }
    }
  }
}

function describeShape(obj: any) {
  if (!obj) return { type: typeof obj }
  if (Array.isArray(obj)) return { type: 'array', length: obj.length }
  if (typeof obj === 'object') return { type: 'object', keys: Object.keys(obj).slice(0, 10) }
  return { type: typeof obj }
}
