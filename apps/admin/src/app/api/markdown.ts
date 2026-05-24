import { API_URL } from '~/app/constants/env'

import { postJson } from './http'

export interface MarkdownImportData {
  content?: string
  data?: unknown[]
  type?: 'note' | 'page' | 'post'
}

export interface MarkdownExportParams {
  id?: string
  show_title?: boolean
  slug?: boolean
  type?: 'note' | 'page' | 'post'
  with_meta_json?: boolean
  yaml?: boolean
}

export function importMarkdown(data: MarkdownImportData) {
  return postJson<{ id: string }, MarkdownImportData>('/markdown/import', data)
}

export async function exportMarkdown(params?: MarkdownExportParams) {
  const searchParams = new URLSearchParams()

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  const response = await fetch(
    `${API_URL}/markdown/export${query ? `?${query}` : ''}`,
    {
      credentials: 'include',
      headers: {
        'x-skip-translation': '1',
      },
    },
  )

  if (!response.ok) {
    throw new Error(response.statusText || 'Export failed')
  }

  return response.blob()
}
