import type { Image } from '~/models/base'

import { filesApi } from '~/api/files'
import { useUploadQueue } from '~/components/upload-queue'
import { API_URL } from '~/constants/env'

const BATCH_SIZE = 3

function extractFileName(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const segments = pathname.split('/')
    return segments[segments.length - 1] || 'unknown'
  } catch {
    return url.split('/').pop() || 'unknown'
  }
}

function isLocalApiUrl(url: string): boolean {
  if (!API_URL) return false
  try {
    const apiOrigin = new URL(API_URL).origin
    const urlOrigin = new URL(url).origin
    return urlOrigin === apiOrigin
  } catch {
    return false
  }
}

function extractImageUrls(text: string): string[] {
  const markdownImageRegex = /!\[.*?\]\((https?:\/\/[^)]+)\)/g
  const htmlImageRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi
  const urls: string[] = []

  let match: RegExpExecArray | null
  while ((match = markdownImageRegex.exec(text)) !== null) {
    urls.push(match[1])
  }
  while ((match = htmlImageRegex.exec(text)) !== null) {
    urls.push(match[1])
  }

  return urls
}

export function useS3Upload() {
  const queue = useUploadQueue()

  async function processLocalImages(
    text: string,
    images: Image[],
  ): Promise<{ text: string; images: Image[] }> {
    const validImages = images.filter((img) => img?.src)
    const textImageUrls = extractImageUrls(text)
    const imageFieldUrls = validImages.map((img) => img.src)

    const allUrls = [...textImageUrls, ...imageFieldUrls]
    const localUrls = [...new Set(allUrls.filter(isLocalApiUrl))]

    if (localUrls.length === 0) {
      return { text, images: validImages }
    }

    // 检查 S3 配置是否开启
    try {
      const { data: config } = await filesApi.s3.getConfig()
      if (!config.enable || !config.syncOnPublish) {
        return { text, images: validImages }
      }
    } catch {
      return { text, images: validImages }
    }

    const tasks = localUrls.map((url, index) => ({
      id: `upload-${index}-${Date.now()}`,
      localUrl: url,
      fileName: extractFileName(url),
    }))

    queue.addTasks(tasks)

    const urlMapping = new Map<string, string>()

    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE)
      const batchUrls = batch.map((t) => t.localUrl)

      batch.forEach((task) => {
        queue.updateTask(task.id, { status: 'uploading' })
      })

      try {
        const response = await filesApi.s3.batchUpload(batchUrls)

        for (const result of response.results) {
          const task = batch.find((t) => t.localUrl === result.originalUrl)
          if (!task) continue

          if (result.s3Url) {
            urlMapping.set(result.originalUrl, result.s3Url)
            queue.updateTask(task.id, {
              status: 'success',
              s3Url: result.s3Url,
            })
          } else {
            queue.updateTask(task.id, {
              status: 'error',
              error: result.error || '上传失败',
            })
          }
        }
      } catch (error) {
        batch.forEach((task) => {
          queue.updateTask(task.id, {
            status: 'error',
            error: error instanceof Error ? error.message : '上传失败',
          })
        })
      }
    }

    let processedText = text
    urlMapping.forEach((s3Url, localUrl) => {
      processedText = processedText.split(localUrl).join(s3Url)
    })

    const processedImages = validImages.map((img) => ({
      ...img,
      src: urlMapping.get(img.src) || img.src,
    }))

    queue.hideWithDelay(3000)

    return { text: processedText, images: processedImages }
  }

  return {
    processLocalImages,
    queue,
  }
}
