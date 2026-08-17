// src/server/lib/logger.ts

export type LogPayload = {
  requestId?: string
  route?: string
  step?: string
  status?: string
  error?: string
  [k: string]: any
}

function safeStringify(obj: any) {
  try {
    return JSON.stringify(obj)
  } catch (_) {
    return '<<unserializable>>'
  }
}

export const logger = {
  info: (payload: LogPayload) => {
    const out = {
      ts: new Date().toISOString(),
      level: 'info',
      ...payload,
    }
    // Structured JSON to make grepping / parsing easier
    // Do not log secrets here; callers should mask tokens
    console.log(safeStringify(out))
  },
  error: (payload: LogPayload) => {
    const out = {
      ts: new Date().toISOString(),
      level: 'error',
      ...payload,
    }
    console.error(safeStringify(out))
  },
}
