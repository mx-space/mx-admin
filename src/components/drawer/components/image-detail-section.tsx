import { decode } from 'blurhash'
import { uniqBy } from 'es-toolkit/compat'
import { ChevronDownIcon, ExternalLinkIcon, Trash2Icon } from 'lucide-vue-next'
import {
  NButton,
  NCheckbox,
  NColorPicker,
  NInput,
  NInputNumber,
} from 'naive-ui'
import type { Image as ImageModel } from '~/models/base'
import type { PropType } from 'vue'

import {
  encodeImageToBlurhash,
  encodeImageToBlurhashWebgl,
  getDominantColor,
} from '~/utils/image'
import { isVideoExt, pickImagesFromMarkdown } from '~/utils/markdown'

export const ImageDetailSection = defineComponent({
  props: {
    images: {
      type: Array as PropType<ImageModel[]>,
      required: true,
    },
    onChange: {
      type: Function as PropType<(images: ImageModel[]) => void>,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    extraImages: {
      type: Array as PropType<string[]>,
      required: false,
    },
  },
  setup(props) {
    const loading = ref(false)

    const useWebglFlag = useStorage('useWebglFlag', false)

    const originImageMap = computed(() => {
      const map = new Map<string, ImageModel>()
      props.images.forEach((image) => {
        map.set(image.src, image)
      })
      return map
    })

    const images = computed<ImageModel[]>(() => {
      const basedImages: ImageModel[] = props.text
        ? uniqBy(
            pickImagesFromMarkdown(props.text)
              .map((src) => {
                const existImageInfo = originImageMap.value.get(src)
                return {
                  src,
                  height: existImageInfo?.height,
                  width: existImageInfo?.width,
                  type: existImageInfo?.type,
                  accent: existImageInfo?.accent,
                  blurHash: existImageInfo?.blurHash,
                } as any
              })
              .concat(props.images),
            'src',
          )
        : props.images
      const srcSet = new Set<string>()

      for (const image of basedImages) {
        image.src && srcSet.add(image.src)
      }
      const nextImages = basedImages.concat()
      if (props.extraImages) {
        // 需要过滤存在的图片
        props.extraImages.forEach((src) => {
          if (!srcSet.has(src)) {
            nextImages.push({
              src,
              height: 0,
              width: 0,
              type: '',
              accent: '',
            })
          }
        })
      }

      return nextImages
    })
    const handleCorrectImageDimensions = async () => {
      loading.value = true

      const fetchImageTasks = await Promise.allSettled(
        images.value.map((item) => {
          return new Promise<ImageModel>((resolve, reject) => {
            const ext = item.src.split('.').pop()!
            const isVideo = isVideoExt(ext)

            if (isVideo) {
              const video = document.createElement('video')

              video.src = item.src

              video.addEventListener('loadedmetadata', () => {
                resolve({
                  height: video.videoHeight,
                  type: ext,
                  src: item.src,
                  width: video.videoWidth,
                  accent: '#fff',
                })
              })

              video.addEventListener('error', (e) => {
                reject({
                  err: e,
                  src: item.src,
                })
              })
            } else {
              const $image = new Image()
              $image.src = item.src
              $image.crossOrigin = 'Anonymous'
              $image.addEventListener('load', () => {
                resolve({
                  width: $image.naturalWidth,
                  height: $image.naturalHeight,
                  src: item.src,
                  type: ext,
                  accent: getDominantColor($image),
                  blurHash: useWebglFlag
                    ? encodeImageToBlurhashWebgl($image)
                    : encodeImageToBlurhash($image),
                })
              })
              $image.onerror = (err) => {
                reject({
                  err,
                  src: item.src,
                })
              }
            }
          })
        }),
      )

      loading.value = false

      const nextImageDimensions = [] as ImageModel[]
      fetchImageTasks.map((task) => {
        if (task.status === 'fulfilled') nextImageDimensions.push(task.value)
        else {
          message.warning(
            ` 获取图片信息失败：${task.reason.src}: ${task.reason.err}`,
          )
        }
      })

      props.onChange(nextImageDimensions)

      loading.value = false
    }

    // 展开状态管理
    const expandedIndex = ref<number | null>(null)

    return () => (
      <div class="flex w-full flex-col">
        {/* 头部操作区 */}
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-neutral-500">
            调整 Markdown 中的图片信息
          </span>
          <NButton
            loading={loading.value}
            size="small"
            onClick={handleCorrectImageDimensions}
            type="primary"
            secondary
          >
            自动修正
          </NButton>
        </div>

        {/* WebGL 选项 */}
        <label class="mt-3 flex cursor-pointer items-center gap-2 text-xs text-neutral-400">
          <NCheckbox
            size="small"
            checked={useWebglFlag.value}
            onUpdateChecked={(e) => void (useWebglFlag.value = e)}
            aria-label="使用 WebGL 加速"
          />
          <span>使用 WebGL 加速图片处理（实验性）</span>
        </label>

        {/* 图片列表 */}
        {images.value.length > 0 && (
          <div class="mt-4 space-y-2">
            {images.value.map((image: ImageModel, index: number) => {
              const isExpanded = expandedIndex.value === index
              const fileName = image.src.split('/').pop() || image.src

              return (
                <div
                  key={image.src}
                  class="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  {/* 折叠头部 */}
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-2 bg-neutral-50 px-3 py-2.5 text-left transition-colors hover:bg-neutral-100 dark:bg-neutral-800/50 dark:hover:bg-neutral-800"
                    onClick={() => {
                      expandedIndex.value = isExpanded ? null : index
                    }}
                    aria-expanded={isExpanded}
                    aria-controls={`image-detail-${index}`}
                  >
                    <span class="min-w-0 flex-1 truncate text-sm text-neutral-700 dark:text-neutral-200">
                      {fileName}
                    </span>
                    <div class="flex items-center gap-1 text-xs text-neutral-400">
                      {image.width && image.height && (
                        <span>
                          {image.width}×{image.height}
                        </span>
                      )}
                      <ChevronDownIcon
                        class={[
                          'size-4 transition-transform',
                          isExpanded && 'rotate-180',
                        ]}
                      />
                    </div>
                  </button>

                  {/* 展开内容 */}
                  {isExpanded && (
                    <div
                      id={`image-detail-${index}`}
                      class="space-y-3 border-t border-neutral-200 p-3 dark:border-neutral-700"
                    >
                      {/* 尺寸 */}
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="mb-1 block text-xs text-neutral-500">
                            宽度
                          </label>
                          <NInputNumber
                            class="w-full"
                            size="small"
                            value={image.width}
                            onUpdateValue={(n) => {
                              if (!n) return
                              props.images[index].width = n
                            }}
                            aria-label="图片宽度"
                          />
                        </div>
                        <div>
                          <label class="mb-1 block text-xs text-neutral-500">
                            高度
                          </label>
                          <NInputNumber
                            class="w-full"
                            size="small"
                            value={image.height}
                            onUpdateValue={(n) => {
                              if (!n) return
                              props.images[index].height = n
                            }}
                            aria-label="图片高度"
                          />
                        </div>
                      </div>

                      {/* 类型和主色调 */}
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="mb-1 block text-xs text-neutral-500">
                            类型
                          </label>
                          <NInput
                            class="w-full"
                            size="small"
                            value={image.type || ''}
                            onUpdateValue={(n) => {
                              if (!n) return
                              props.images[index].type = n
                            }}
                            placeholder="jpg, png..."
                            aria-label="图片类型"
                          />
                        </div>
                        <div>
                          <label class="mb-1 block text-xs text-neutral-500">
                            主色调
                          </label>
                          <NColorPicker
                            size="small"
                            value={image.accent || ''}
                            onUpdateValue={(n) => {
                              if (!n) return
                              props.images[index].accent = n
                            }}
                            aria-label="主色调"
                          />
                        </div>
                      </div>

                      {/* BlurHash 预览 */}
                      {image.blurHash && (
                        <div>
                          <label class="mb-1 block text-xs text-neutral-500">
                            BlurHash 预览
                          </label>
                          <BlurHashPreview hash={image.blurHash} />
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div class="flex justify-end gap-2 pt-1">
                        <NButton
                          size="small"
                          quaternary
                          onClick={() => {
                            window.open(image.src)
                          }}
                          aria-label="在新窗口查看图片"
                        >
                          {{
                            icon: () => <ExternalLinkIcon class="size-4" />,
                            default: () => '查看',
                          }}
                        </NButton>

                        <NButton
                          size="small"
                          quaternary
                          type="error"
                          onClick={() => {
                            props.images.splice(index, 1)
                            if (expandedIndex.value === index) {
                              expandedIndex.value = null
                            }
                          }}
                          aria-label="删除图片"
                        >
                          {{
                            icon: () => <Trash2Icon class="size-4" />,
                            default: () => '删除',
                          }}
                        </NButton>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 空状态 */}
        {images.value.length === 0 && (
          <div class="mt-4 rounded-lg border border-dashed border-neutral-200 py-6 text-center text-sm text-neutral-400 dark:border-neutral-700">
            文章中暂无图片
          </div>
        )}
      </div>
    )
  },
})

const BlurHashPreview = defineComponent({
  props: {
    hash: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const canvasRef = ref<HTMLCanvasElement | null>(null)

    onMounted(() => {
      const canvas = canvasRef.value!
      const ctx = canvas.getContext('2d')!
      const pixels = decode(props.hash, 32, 32)
      const imageData = ctx.createImageData(32, 32)
      imageData.data.set(pixels)
      ctx.putImageData(imageData, 0, 0)
    })

    return () => (
      <canvas
        ref={canvasRef}
        class="rounded bg-cover bg-center"
        height={32}
        width={32}
        aria-label="BlurHash 预览图"
      />
    )
  },
})
