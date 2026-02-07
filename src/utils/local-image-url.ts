const LOCAL_IMAGE_PATH = '/objects/image/'

const uploadedLocalImagePathSet = new Set<string>()

const normalizeLocalImagePath = (url: string): string | null => {
  if (!url) return null

  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost',
    )
    const pathname = parsed.pathname || ''
    const index = pathname.indexOf(LOCAL_IMAGE_PATH)
    if (index === -1) return null
    return pathname.slice(index)
  } catch {
    const index = url.indexOf(LOCAL_IMAGE_PATH)
    if (index === -1) return null

    const pathWithQuery = url.slice(index)
    return pathWithQuery.split(/[?#]/)[0]
  }
}

export const recordUploadedLocalImageUrl = (url: string) => {
  const path = normalizeLocalImagePath(url)
  if (!path) return
  uploadedLocalImagePathSet.add(path)
}

export const hasUploadedLocalImageUrl = (url: string) => {
  const path = normalizeLocalImagePath(url)
  if (!path) return false
  return uploadedLocalImagePathSet.has(path)
}

export const isLocalObjectImageUrl = (
  url: string,
  apiUrl?: string,
): boolean => {
  const path = normalizeLocalImagePath(url)
  if (!path) {
    return false
  }

  if (hasUploadedLocalImageUrl(url)) {
    return true
  }

  try {
    const parsed = new URL(url)
    const appOrigin =
      typeof window !== 'undefined' ? window.location.origin : ''

    if (parsed.origin === appOrigin) {
      return true
    }

    if (apiUrl) {
      const apiOrigin = new URL(apiUrl).origin
      if (parsed.origin === apiOrigin) {
        return true
      }
    }

    return false
  } catch {
    // Relative URL, e.g. /objects/image/xxx.png
    return true
  }
}
