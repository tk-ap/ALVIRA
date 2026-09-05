export const BRIDGE_STATUS_HEADERS = { "Cache-Control": "no-store" } as const;

/**
 * /api/bridge/context is the ALVIRA-owned legacy browser compatibility status
 * endpoint. "No legacy connection" is a normal UI state, not an authentication
 * failure. The actual Context remains protected by a valid Bridge principal.
 */
export function disconnectedLegacyBridgeContextResponse() {
  return Response.json(
    { connected: false, error: "not_connected" },
    { headers: BRIDGE_STATUS_HEADERS },
  );
}
