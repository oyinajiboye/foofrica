import { API_BASE } from './api'
export async function startOAuth(provider) {
 const response = await fetch(`${API_BASE}/api/auth/oauth/${provider}`, {method:'POST'})
 const result = await response.json()
 if (!response.ok || !result.data?.verifier) throw new Error(result.message || 'Unable to start sign-in.')
 sessionStorage.setItem('ff_pkce', result.data.verifier)
 window.location.assign(result.data.url)
}
