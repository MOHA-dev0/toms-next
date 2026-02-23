// Client-side API utility
// This is used by client components to call internal API routes
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

interface FetchOptions extends RequestInit {
  data?: any
}

async function fetcher(url: string, options: FetchOptions = {}) {
  const { data, ...fetchOptions } = options

  const config: RequestInit = {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  }

  if (data) {
    config.body = JSON.stringify(data)
  }

  const response = await fetch(`${API_BASE}${url}`, config)

  if (response.status === 401) {
    window.location.href = '/auth'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

const api = {
  get: (url: string, options?: FetchOptions) =>
    fetcher(url, { ...options, method: 'GET' }),
  
  post: (url: string, data?: any, options?: FetchOptions) =>
    fetcher(url, { ...options, method: 'POST', data }),
  
  put: (url: string, data?: any, options?: FetchOptions) =>
    fetcher(url, { ...options, method: 'PUT', data }),
  
  delete: (url: string, options?: FetchOptions) =>
    fetcher(url, { ...options, method: 'DELETE' }),
}

export default api
