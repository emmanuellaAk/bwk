let _salonId: string | null = null

function decodeSalonId(token: string): string | null {
  try {
    // Base64url → Base64 → JSON
    const encoded = token.split('.')[1]
    if (!encoded) return null
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(b64)) as Record<string, unknown>
    return typeof payload['salon_id'] === 'string' ? payload['salon_id'] : null
  } catch {
    return null
  }
}

export const salonStore = {
  get: () => _salonId,
  setFromToken: (token: string) => { _salonId = decodeSalonId(token) },
  clear: () => { _salonId = null },
}
