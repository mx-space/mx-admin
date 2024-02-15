import { getToken, RESTManager } from 'utils'

export const buildMarkdownRenderUrl = (id: string, withToken?: boolean) => {
  const endpoint = RESTManager.endpoint
  const url = new URL(endpoint)
  return `${url.protocol}//${url.host}/render/markdown/${id}${
    withToken ? `?token=${getToken()}` : ''
  }`
}
