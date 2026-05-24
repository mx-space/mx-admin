import { API_URL } from '~/app/constants/env'

type ResponseEnvelope<T> = {
  data?: T
  error?: { message?: string | string[] }
  meta?: {
    pagination?: unknown
  }
  message?: string | string[]
}

export async function postJson<TResponse, TData>(
  path: string,
  data: TData,
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  })
}

type QueryValue = Array<number | string> | boolean | number | string | undefined

export async function getJson<TResponse>(
  path: string,
  params?: Record<string, QueryValue>,
): Promise<TResponse> {
  return requestJson<TResponse>(withQuery(path, params), { method: 'GET' })
}

export async function requestJson<TResponse>(
  path: string,
  init: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'x-skip-translation': '1',
      ...init.headers,
    },
  })

  const responseData = await readResponseData<TResponse>(response)

  if (!response.ok) {
    const message =
      responseData?.error?.message ||
      responseData?.message ||
      response.statusText

    throw new Error(
      Array.isArray(message) ? message.join(', ') : message || 'Request failed',
    )
  }

  if (responseData && 'data' in responseData) {
    if (responseData.meta?.pagination) {
      return {
        data: responseData.data,
        pagination: responseData.meta.pagination,
      } as TResponse
    }

    return responseData.data as TResponse
  }

  return responseData as TResponse
}

export async function putJson<TResponse, TData>(
  path: string,
  data: TData,
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json',
    },
    method: 'PUT',
  })
}

export async function patchJson<TResponse, TData>(
  path: string,
  data: TData,
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json',
    },
    method: 'PATCH',
  })
}

export async function deleteJson<TResponse, TData = undefined>(
  path: string,
  data?: TData,
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    ...(data === undefined
      ? {}
      : {
          body: JSON.stringify(data),
          headers: {
            'content-type': 'application/json',
          },
        }),
    method: 'DELETE',
  })
}

function withQuery(path: string, params?: Record<string, QueryValue>) {
  if (!params) return path

  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)))
      continue
    }

    searchParams.set(key, String(value))
  }

  const query = searchParams.toString()

  return query ? `${path}?${query}` : path
}

async function readResponseData<TResponse>(response: Response) {
  try {
    return (await response.json()) as ResponseEnvelope<TResponse>
  } catch {
    return null
  }
}
