import type { MxServerOptions } from '~/models/options'

import { RESTManager } from '~/utils'

let cachedConfig: MxServerOptions.ImageUploadOption | null = null

export const useImageUpload = () => {
  const upload = async (file: File): Promise<string> => {
    // get config
    if (!cachedConfig) {
      const { data } = await RESTManager.api.options('imageUploadOptions').get<{
        data: MxServerOptions.ImageUploadOption
      }>()
      cachedConfig = data
    }

    // enable message
    if (cachedConfig.provider === 'none') {
      message.info('图片自动上传未开启，请前往设置页面开启哦')
      throw new Error('Image upload is disabled')
    }

    try {
      let url: string

      if (cachedConfig.provider === 'self') {
        // use self-hosted API
        const formData = new FormData()
        formData.append('file', file)

        const { url: uploadedUrl } = await RESTManager.api.objects.upload.post<{
          url: string
        }>({
          params: { type: 'file' },
          data: formData,
        })

        url = uploadedUrl
      } else {
        // S3 or custom handle by backend
        const formData = new FormData()
        formData.append('file', file)

        const { url: uploadedUrl } = await RESTManager.api.files[
          'upload/image'
        ].post<{
          url: string
        }>({
          data: formData,
        })

        url = uploadedUrl
      }

      message.success('图片上传成功')
      return url
    } catch (error) {
      console.error('Auto upload image failed:', error)
      message.error('图片上传失败，请检查您的配置或重新尝试~')
      throw error
    }
  }

  return {
    upload,
  }
}
