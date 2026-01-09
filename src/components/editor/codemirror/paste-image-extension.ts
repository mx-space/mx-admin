import { EditorView } from '@codemirror/view'

import { RESTManager } from '~/utils'

let dragOverlay: HTMLDivElement | null = null

function showDragOverlay(container: HTMLElement) {
  if (dragOverlay) return

  dragOverlay = document.createElement('div')
  dragOverlay.className = 'editor-drag-overlay'
  dragOverlay.innerHTML = `
    <div class="editor-drag-content">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
      <div class="editor-drag-text">拖放图片到这里上传</div>
    </div>
  `

  const style = document.createElement('style')
  style.textContent = `
    .editor-drag-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(59, 130, 246, 0.1);
      backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed rgba(59, 130, 246, 0.5);
      border-radius: 8px;
      pointer-events: none;
    }
    .editor-drag-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: rgba(59, 130, 246, 0.8);
    }
    .editor-drag-text {
      font-size: 18px;
      font-weight: 500;
    }
    .dark .editor-drag-overlay {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.6);
    }
    .dark .editor-drag-content {
      color: rgba(96, 165, 250, 0.9);
    }
  `
  document.head.appendChild(style)

  container.style.position = 'relative'
  container.appendChild(dragOverlay)
}

function hideDragOverlay() {
  if (dragOverlay) {
    dragOverlay.remove()
    dragOverlay = null
  }
}

function validateFile(
  file: File,
  maxSizeMB: number,
): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: '只能上传图片文件哦~' }
  }

  const maxSize = maxSizeMB * 1024 * 1024
  if (file.size > maxSize) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2)
    return {
      valid: false,
      error: `图片大小 ${sizeMB}MB 超过限制 ${maxSizeMB}MB`,
    }
  }

  return { valid: true }
}

async function uploadImage(file: File): Promise<{
  url: string
  name: string
  storage: 'local' | 's3'
} | null> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await RESTManager.api.objects.upload.post<{
      url: string
      name: string
      storage: 'local' | 's3'
    }>({
      params: {
        type: 'photo',
      },
      data: formData,
    })

    window.message.success(
      `上传成功！存储位置: ${response.storage === 's3' ? 'S3' : '本地'}`,
    )

    return response
  } catch (error: any) {
    window.message.error(`上传失败: ${error.message || '未知错误'}`)
    return null
  }
}

function insertImageMarkdown(view: EditorView, alt: string, url: string) {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)

  const insertPos = line.to
  const needsNewline = line.text.length > 0
  const insert = `${needsNewline ? '\n' : ''}![${alt}](${url})\n`

  view.dispatch({
    changes: { from: insertPos, to: insertPos, insert },
    selection: {
      anchor: insertPos + insert.length,
    },
  })
}

async function handleFilesUpload(files: File[], view: EditorView) {
  if (files.length === 0) {
    return
  }

  let maxSizeMB = 10
  try {
    const config = await RESTManager.api.options('imageBedOptions').get<any>()
    if (config?.data?.maxSizeMB) {
      maxSizeMB = config.data.maxSizeMB
    }
  } catch (_error) {
    console.warn('Failed to fetch image bed config, using default 10MB')
  }

  if (files.length > 1) {
    window.message.info(`检测到 ${files.length} 张图片，开始上传...`)
  }

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    const validation = validateFile(file, maxSizeMB)
    if (!validation.valid) {
      window.message.error(`${file.name}: ${validation.error}`)
      failCount++
      continue
    }

    const loadingMessage = window.message.loading(
      `正在上传 ${file.name} (${i + 1}/${files.length})...`,
      {
        duration: 0,
      },
    )

    const result = await uploadImage(file)

    loadingMessage.destroy()

    if (result) {
      const alt = file.name.replace(/\.[^/.]+$/, '')
      insertImageMarkdown(view, alt, result.url)
      successCount++
    } else {
      failCount++
    }
  }

  if (successCount > 0) {
    if (failCount > 0) {
      window.message.warning(
        `上传完成！成功 ${successCount} 张，失败 ${failCount} 张`,
      )
    } else {
      window.message.success(`成功上传 ${successCount} 张图片`)
    }
  } else if (failCount > 0) {
    window.message.error(`所有图片上传失败`)
  }
}

export function createPasteImageExtension() {
  let dragCounter = 0

  return EditorView.domEventHandlers({
    paste: (event: ClipboardEvent, view: EditorView) => {
      const items = event.clipboardData?.items
      if (!items) return false

      const imageItems: DataTransferItem[] = []
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          imageItems.push(items[i])
        }
      }

      if (imageItems.length === 0) {
        return false
      }

      event.preventDefault()

      const files: File[] = []
      for (const item of imageItems) {
        const file = item.getAsFile()
        if (file) {
          files.push(file)
        }
      }

      handleFilesUpload(files, view)

      return true
    },

    dragover: (event: DragEvent, _view: EditorView) => {
      const types = event.dataTransfer?.types
      if (types && types.includes('Files')) {
        event.preventDefault()
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'copy'
        }
      }
      return false
    },

    dragenter: (event: DragEvent, view: EditorView) => {
      const types = event.dataTransfer?.types
      if (types && types.includes('Files')) {
        dragCounter++
        if (dragCounter === 1) {
          showDragOverlay(view.dom)
        }
      }
      return false
    },

    dragleave: (event: DragEvent) => {
      const types = event.dataTransfer?.types
      if (types && types.includes('Files')) {
        dragCounter--
        if (dragCounter === 0) {
          hideDragOverlay()
        }
      }
      return false
    },

    drop: (event: DragEvent, view: EditorView) => {
      dragCounter = 0
      hideDragOverlay()

      const files = event.dataTransfer?.files
      if (!files || files.length === 0) {
        return false
      }

      const imageFiles: File[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.type.startsWith('image/')) {
          imageFiles.push(file)
        }
      }

      if (imageFiles.length === 0) {
        return false
      }

      event.preventDefault() // anti browser open pic
      handleFilesUpload(imageFiles, view)
      return true
    },
  })
}
