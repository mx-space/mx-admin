import { decode } from 'blurhash'
import { uniqBy } from 'es-toolkit/compat'
import {
  NButton,
  NButtonGroup,
  NCollapse,
  NCollapseItem,
  NColorPicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
} from 'naive-ui'
import type { Image as ImageModel } from '~/models/base'
import type { PropType } from 'vue'

import { encodeImageToBlurhash, getDominantColor } from '~/utils/image'
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
                  blurHash: encodeImageToBlurhash($image),
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
            `获取图片信息失败：${task.reason.src}: ${task.reason.err}`,
          )
        }
      })

      props.onChange(nextImageDimensions)

      loading.value = false
    }

    return () => (
      <div class="relative flex w-full flex-grow flex-col">
        <div class="flex items-center justify-between space-x-2">
          <div class="inline-block flex-shrink flex-grow">
            调整 Markdown 中包含的图片信息
          </div>
          <NButton
            loading={loading.value}
            class="self-end"
            round
            onClick={handleCorrectImageDimensions}
          >
            自动修正
          </NButton>
        </div>

        <NCollapse accordion class="mt-4">
          {images.value.map((image: ImageModel, index: number) => {
            return (
              <NCollapseItem
                key={image.src}
                // @ts-expect-error
                title={
                  <span class="flex w-full flex-shrink break-all">
                    {image.src}
                  </span>
                }
              >
                <NForm labelPlacement="left" labelWidth="100">
                  <NFormItem label="高度">
                    <NInputNumber
                      value={image.height}
                      onUpdateValue={(n) => {
                        if (!n) {
                          return
                        }
                        props.images[index].height = n
                      }}
                    />
                  </NFormItem>

                  <NFormItem label="宽度">
                    <NInputNumber
                      value={image.width}
                      onUpdateValue={(n) => {
                        if (!n) {
                          return
                        }
                        props.images[index].width = n
                      }}
                    />
                  </NFormItem>
                  <NFormItem label="类型">
                    <NInput
                      value={image.type || ''}
                      onUpdateValue={(n) => {
                        if (!n) {
                          return
                        }
                        props.images[index].type = n
                      }}
                    />
                  </NFormItem>
                  <NFormItem label="主色调">
                    <NColorPicker
                      value={image.accent || ''}
                      onUpdateValue={(n) => {
                        if (!n) {
                          return
                        }
                        props.images[index].accent = n
                      }}
                    ></NColorPicker>
                  </NFormItem>

                  <NFormItem label="Blur Preview">
                    <div>
                      {image.blurHash && (
                        <BlurHashPreview hash={image.blurHash} />
                      )}
                    </div>
                  </NFormItem>

                  <NFormItem label="操作">
                    <div class="flex w-full justify-end">
                      <NButtonGroup>
                        <NButton
                          round
                          onClick={() => {
                            window.open(image.src)
                          }}
                          secondary
                        >
                          查看
                        </NButton>

                        <NButton
                          secondary
                          round
                          type="error"
                          onClick={() => {
                            props.images.splice(index, 1)
                          }}
                        >
                          删除
                        </NButton>
                      </NButtonGroup>
                    </div>
                  </NFormItem>
                </NForm>
              </NCollapseItem>
            )
          })}
        </NCollapse>
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
        class="bg-cover bg-center"
        height={32}
        width={32}
      ></canvas>
    )
  },
})
