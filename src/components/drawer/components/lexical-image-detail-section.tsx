import { uniqBy } from 'es-toolkit/compat'
import { $nodesOfType } from 'lexical'
import { ImageIcon } from 'lucide-vue-next'
import { NButton } from 'naive-ui'
import { computed, defineComponent, ref } from 'vue'
import { toast } from 'vue-sonner'
import type { LexicalEditor } from 'lexical'
import type { PropType } from 'vue'

import { ImageNode } from '@haklex/rich-editor/nodes'

import { encodeImageToThumbhash, getDominantColor } from '~/utils/image'

type SerializedImageNode = {
  type: string
  src?: string
  width?: number
  height?: number
  accent?: string
  thumbhash?: string
  children?: SerializedImageNode[]
}

type LexicalImageMeta = {
  src: string
  width?: number
  height?: number
  accent?: string
  thumbhash?: string
}

const collectImageNodes = (nodes: SerializedImageNode[] = []) => {
  const images: LexicalImageMeta[] = []

  nodes.forEach((node) => {
    if (node.type === 'image' && node.src) {
      images.push({
        src: node.src,
        width: node.width,
        height: node.height,
        accent: node.accent,
        thumbhash: node.thumbhash,
      })
    }

    if (node.children?.length) {
      images.push(...collectImageNodes(node.children))
    }
  })

  return images
}

export const LexicalImageDetailSection = defineComponent({
  name: 'LexicalImageDetailSection',
  props: {
    content: {
      type: String,
      required: true,
    },
    editor: {
      type: Object as PropType<LexicalEditor | null>,
      required: false,
      default: null,
    },
  },
  setup(props) {
    const loading = ref(false)

    const images = computed(() => {
      if (!props.content) {
        return [] as LexicalImageMeta[]
      }

      try {
        const parsed = JSON.parse(props.content) as {
          root?: { children?: SerializedImageNode[] }
        }
        return uniqBy(collectImageNodes(parsed.root?.children), 'src')
      } catch {
        return [] as LexicalImageMeta[]
      }
    })

    const handleCorrectImageDimensions = async () => {
      if (!props.editor) {
        toast.warning('Lexical 编辑器尚未就绪')
        return
      }

      loading.value = true

      const fetchImageTasks = await Promise.allSettled(
        images.value.map((item) => {
          return new Promise<LexicalImageMeta>((resolve, reject) => {
            const image = new Image()
            image.crossOrigin = 'Anonymous'
            image.src = item.src

            image.addEventListener('load', async () => {
              try {
                let accent = item.accent
                let thumbhash = item.thumbhash

                try {
                  accent = getDominantColor(image)
                } catch {
                  // Cross-origin images may block canvas reads.
                }

                try {
                  thumbhash = await encodeImageToThumbhash(image)
                } catch {
                  // Keep existing thumbhash when recomputing is not possible.
                }

                resolve({
                  src: item.src,
                  width: image.naturalWidth,
                  height: image.naturalHeight,
                  accent,
                  thumbhash,
                })
              } catch (error) {
                reject({
                  err: error,
                  src: item.src,
                })
              }
            })

            image.onerror = (err) => {
              reject({
                err,
                src: item.src,
              })
            }
          })
        }),
      )

      const nextImageMetaMap = new Map<string, LexicalImageMeta>()

      fetchImageTasks.forEach((task) => {
        if (task.status === 'fulfilled') {
          nextImageMetaMap.set(task.value.src, task.value)
          return
        }

        toast.warning(`获取图片信息失败：${task.reason.src}`)
      })

      props.editor.update(() => {
        const imageNodes = $nodesOfType(ImageNode)
        imageNodes.forEach((node) => {
          const nextMeta = nextImageMetaMap.get(node.getSrc())
          if (!nextMeta) return

          node.setDimensions(nextMeta.width, nextMeta.height)
          node.setAccent(nextMeta.accent)
          node.setThumbhash(nextMeta.thumbhash)
        })
      })

      loading.value = false
    }

    return () => (
      <div class="flex w-full flex-col">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-neutral-500">
            调整 Lexical 中的图片信息
          </span>
          <NButton
            loading={loading.value}
            size="tiny"
            onClick={handleCorrectImageDimensions}
            type="primary"
            tertiary
            disabled={!props.editor || images.value.length === 0}
          >
            自动修正
          </NButton>
        </div>

        {images.value.length > 0 ? (
          <div class="mt-4 space-y-2">
            {images.value.map((image) => {
              const fileName = image.src.split('/').pop() || image.src
              return (
                <div
                  key={image.src}
                  class="rounded-lg border border-neutral-200 px-3 py-2.5 dark:border-neutral-700"
                >
                  <div class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
                    <ImageIcon class="h-4 w-4 flex-shrink-0 text-neutral-400" />
                    <span class="min-w-0 flex-1 truncate">{fileName}</span>
                  </div>
                  <div class="mt-1 text-xs text-neutral-400">
                    {image.width && image.height
                      ? `${image.width}×${image.height}`
                      : '未写入尺寸'}
                    {image.accent ? ' · 已有 accent' : ''}
                    {image.thumbhash ? ' · 已有 thumbhash' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div class="mt-4 rounded-lg border border-dashed border-neutral-200 px-3 py-4 text-sm text-neutral-400 dark:border-neutral-700">
            当前 Lexical 内容中没有图片节点
          </div>
        )}
      </div>
    )
  },
})
