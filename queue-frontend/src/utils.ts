
export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export function requestBackendData(
  url: string,
  token?: string,
  method?: string
): Promise<Response> {
  let auth = {}
  if (token) {
    auth = { 'Authorization': `Bearer ${token}` }
  }

  return fetch(
    `${backendUrl}${url}`,
    {
      method: method,
      headers: {
        ...auth,
        'pragma': 'no-cache',
        'cache-control': 'no-cache',
      }
    }
  )
}