import { API_URL } from '~/constants/env'

export const buildMarkdownRenderUrl = (id: string, _withToken?: boolean) => {
  const url = new URL(API_URL)
  return `${url.protocol}//${url.host}/render/markdown/${id}`
}
