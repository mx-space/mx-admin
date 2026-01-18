import { request } from '~/utils/request'

export interface MarkdownImportData {
  content?: string
  type?: 'post' | 'note' | 'page'
  data?: any[]
}

export interface MarkdownExportParams {
  type?: 'post' | 'note' | 'page'
  id?: string
  slug?: boolean
  yaml?: boolean
  show_title?: boolean
  with_meta_json?: boolean
}

export const markdownApi = {
  // 导入 Markdown
  import: (data: MarkdownImportData) =>
    request.post<{ id: string }>('/markdown/import', { data }),

  // 导出 Markdown
  export: async (params?: MarkdownExportParams): Promise<Blob> => {
    // Use $api directly for blob responses
    const { $api } = await import('~/utils/request')
    return $api('/markdown/export', {
      params,
      responseType: 'blob' as any,
    }) as Promise<Blob>
  },
}
