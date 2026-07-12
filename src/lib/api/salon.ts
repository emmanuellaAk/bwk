let _salonId: string | null = null

function decodeSalonId(token: string): string | null {
  try {
    // Base64url → Base64 → JSON
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
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
