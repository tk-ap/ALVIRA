// src/ui/components/GenerateButtonDiagnostics.tsx
import React, { useState } from 'react'

type Props = {
  endpoint?: string
  payload?: any
  children?: React.ReactNode
}

export default function GenerateButtonDiagnostics({ endpoint = '/api/generate-markdown', payload = {}, children = 'Generate Markdown' }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const requestId = `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': requestId,
        },
        body: JSON.stringify(payload),
      })

      const text = await resp.text()
      let body
      try { body = JSON.parse(text) } catch { body = { text } }

      if (!resp.ok) {
        const errMsg = body && body.error && body.error.message ? body.error.message : `HTTP ${resp.status}`
        const reqId = resp.headers.get('X-Request-Id') || requestId
        showDiagnostics(errMsg, { requestId: reqId, status: resp.status, body })
        return
      }

      // success
      const reqId = resp.headers.get('X-Request-Id') || requestId
      showDiagnostics('Generation succeeded', { requestId: reqId, status: resp.status, body })
    } catch (err: any) {
      showDiagnostics('Network or client error', { error: String(err) })
    } finally {
      setLoading(false)
    }
  }

  function showDiagnostics(message: string, info: any) {
    // Minimal UI: use window.alert for maximum compatibility. Teams can replace with toasts.
    const blob = JSON.stringify({ message, info }, null, 2)
    if (typeof navigator !== 'undefined' && (navigator as any).clipboard && window.confirm(`${message}\n\nOpen diagnostics?`)) {
      // copy to clipboard
      ;(navigator as any).clipboard.writeText(blob)
      alert('Diagnostics copied to clipboard — paste into an issue or support chat.')
    } else {
      // fallback: show in alert
      alert(`${message}\n\n${blob}`)
    }
  }

  return (
    // keep this minimal so it can be dropped in to existing UI
    <button onClick={handleClick} disabled={loading} aria-busy={loading}>
      {children}
    </button>
  )
}
