// src/server/middleware/requestId.ts
import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

function genRequestId() {
  // Small opaque id — replace with uuid/v4 if available
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = (req.headers['x-request-id'] as string) || (req.headers['x_request_id'] as string)
  const requestId = incoming || genRequestId()
  // Attach to request for handlers to use
  ;(req as any).requestId = requestId
  // Ensure response contains it for client correlation
  res.setHeader('X-Request-Id', requestId)

  logger.info({ requestId, route: req.path, step: 'request-start', method: req.method })
  next()
}
