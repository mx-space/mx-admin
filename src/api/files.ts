import { request } from '~/utils/request'

export interface FileItem {
  name: string
  url: string
  created?: number
}

export interface UploadResponse {
  url: string
  name: string
}

export interface OrphanFile {
  id: string
  fileName: string
  fileUrl: string
  created: string
}

export interface OrphanListResponse {
  data: OrphanFile[]
  pagination: {
    currentPage: number
    totalPage: number
    size: number
    total: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface CleanupResult {
  deletedCount: number
  totalOrphan: number
}

export const filesApi = {
  // 按类型获取文件列表
  getByType: (type: string) => request.get<FileItem[]>(`/files/${type}`),

  // 上传文件
  upload: (file: File, type?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<UploadResponse>('/files/upload', {
      data: formData,
      params: type ? { type } : undefined,
    })
  },

  // 按类型和名称删除文件
  deleteByTypeAndName: (type: string, name: string) =>
    request.delete<void>(`/files/${type}/${name}`),

  // 重命名文件
  rename: (type: string, name: string, newName: string) =>
    request.patch<void>(`/files/${type}/${name}/rename`, {
      data: { name: newName },
    }),

  // 孤儿图片相关
  orphans: {
    // 获取孤儿文件列表
    list: (page = 1, size = 24) =>
      request.get<OrphanListResponse>('/files/orphans/list', {
        query: { page, size },
      }),

    // 获取孤儿文件数量
    count: () => request.get<{ count: number }>('/files/orphans/count'),

    // 清理孤儿文件
    cleanup: (maxAgeMinutes = 60) =>
      request.post<CleanupResult>('/files/orphans/cleanup', {
        query: { maxAgeMinutes },
      }),
  },
}
