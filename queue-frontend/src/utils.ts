
export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export function requestBackendData(
  url: string,
  token?: string,
  method?: string,
  payload?: any,
): Promise<Response> {
  let auth = {}
  if (token) {
    auth = { 'Authorization': `Bearer ${token}` }
  }

  const payloadHeader = payload ? { 'Content-Type': 'application/json' } : null

  return fetch(
    `${backendUrl}${url}`,
    {
      method: method,
      headers: {
        ...auth,
        ...payloadHeader,
        'pragma': 'no-cache',
        'cache-control': 'no-cache',
      },
      body: payload ? JSON.stringify(payload) : null
    }
  )
}