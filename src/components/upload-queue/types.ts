export interface UploadTask {
  id: string
  localUrl: string
  fileName: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  s3Url?: string
  error?: string
}

export interface UploadQueueState {
  tasks: UploadTask[]
  visible: boolean
}
