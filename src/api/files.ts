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
}
