import { API_URL } from '~/constants/env'
import { getToken } from '~/utils'

export const buildMarkdownRenderUrl = (id: string, withToken?: boolean) => {
  const url = new URL(API_URL)
  return `${url.protocol}//${url.host}/render/markdown/${id}${
    withToken ? `?token=${getToken()}` : ''
  }`
}
