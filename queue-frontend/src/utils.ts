
export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export function getBackendData(
  url: string,
  token: string,
): Promise<Response> {
  return fetch(
    `${backendUrl}${url}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'pragma': 'no-cache',
        'cache-control': 'no-cache',
      }
    }
  )
}