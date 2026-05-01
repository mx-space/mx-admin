import { $api, request } from '~/utils/request'

export interface BackupFile {
  filename: string
  size: string
  createdAt: string
}

export const backupApi = {
  // 获取备份列表（响应会被自动解包）
  getList: () => request.get<BackupFile[]>('/backups'),

  // 创建新备份
  createNew: () =>
    $api('/backups/new', {
      method: 'GET',
      responseType: 'blob',
    }) as Promise<Blob>,

  // 下载备份文件
  download: (filename: string) =>
    $api(`/backups/${filename}`, {
      method: 'GET',
      responseType: 'blob',
    }) as Promise<Blob>,

  // 删除备份
  delete: (filename: string) =>
    request.delete<void>(`/backups/${encodeURIComponent(filename)}`),

  // 从备份恢复
  rollback: (filename: string) =>
    request.patch<void>(`/backups/rollback/${filename}`),

  // 上传备份文件并恢复
  uploadAndRestore: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<void, FormData>('/backups/rollback', {
      data: formData,
    })
  },
}
