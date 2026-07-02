// Access token lives only in memory — never written to localStorage or cookies.
// The httpOnly refresh token cookie is managed by the browser automatically.
let _token: string | null = null

export const tokenStore = {
  get: () => _token,
  set: (t: string) => { _token = t },
  clear: () => { _token = null },
}
