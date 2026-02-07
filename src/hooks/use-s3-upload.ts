import type { Image } from '~/models/base'

import { filesApi } from '~/api/files'
import { useUploadQueue } from '~/components/upload-queue'
import { API_URL } from '~/constants/env'
import {
  hasUploadedLocalImageUrl,
  isLocalObjectImageUrl,
  recordUploadedLocalImageUrl,
} from '~/utils/local-image-url'

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
  return isLocalObjectImageUrl(url, API_URL)
}

function extractImageUrls(text: string): string[] {
  const markdownImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  const urls: string[] = []

  let match: RegExpExecArray | null
  while ((match = markdownImageRegex.exec(text)) !== null) {
    const rawValue = match[1]?.trim()
    if (!rawValue) continue

    const urlPart = rawValue.split(/\s+/)[0]?.replace(/^<|>$/g, '')
    if (urlPart) {
      urls.push(urlPart)
    }
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
    images: Image[] = [],
  ): Promise<{ text: string; images: Image[] }> {
    const validImages = images.filter((img) => img?.src)
    const textImageUrls = extractImageUrls(text)
    const imageFieldUrls = validImages.map((img) => img.src)

    const allUrls = [...textImageUrls, ...imageFieldUrls]
    const localUrls = [
      ...new Set(
        allUrls.filter(
          (url) => hasUploadedLocalImageUrl(url) || isLocalApiUrl(url),
        ),
      ),
    ]

    if (localUrls.length === 0) {
      return { text, images: validImages }
    }

    // 检查 S3 配置是否开启
    try {
      const { data: config } = await filesApi.s3.getConfig()
      if (!config.enable || !config.syncOnPublish) {
        return { text, images: validImages }
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : '无法检查图床配置，请稍后重试',
      )
    }

    const tasks = localUrls.map((url, index) => ({
      id: `upload-${index}-${Date.now()}`,
      localUrl: url,
      fileName: extractFileName(url),
    }))

    queue.addTasks(tasks)

    const urlMapping = new Map<string, string>()
    let hasFailedUpload = false

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
            recordUploadedLocalImageUrl(result.s3Url)
            queue.updateTask(task.id, {
              status: 'success',
              s3Url: result.s3Url,
            })
          } else {
            hasFailedUpload = true
            queue.updateTask(task.id, {
              status: 'error',
              error: result.error || '上传失败',
            })
          }
        }
      } catch (error) {
        hasFailedUpload = true
        batch.forEach((task) => {
          queue.updateTask(task.id, {
            status: 'error',
            error: error instanceof Error ? error.message : '上传失败',
          })
        })
      }
    }

    if (hasFailedUpload) {
      throw new Error('部分图片同步到 S3 失败，请修复后重试发布')
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
