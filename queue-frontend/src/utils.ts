
export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export function requestBackendData(
  url: string,
  token: string,
  method?: string
): Promise<Response> {
  return fetch(
    `${backendUrl}${url}`,
    {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'pragma': 'no-cache',
        'cache-control': 'no-cache',
      }
    }
  )
}