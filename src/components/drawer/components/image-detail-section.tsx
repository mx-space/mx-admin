import { Image as ImageModel } from 'models/base'
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
import { getDominantColor } from 'utils/image'
import { pickImagesFromMarkdown } from 'utils/markdown'
import { PropType } from 'vue'

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

    const images = computed<ImageModel[]>(() =>
      props.text
        ? pickImagesFromMarkdown(props.text).map((src) => {
            const existImageInfo = originImageMap.value.get(src)
            return {
              src,
              height: existImageInfo?.height,
              width: existImageInfo?.width,
              type: existImageInfo?.type,
              accent: existImageInfo?.accent,
            } as any
          })
        : props.images,
    )
    const handleCorrectImage = async () => {
      loading.value = true

      try {
        const imagesDetail = await Promise.all(
          images.value.map((item, i) => {
            return new Promise<ImageModel>((resolve, reject) => {
              const $image = new Image()
              $image.src = item.src
              $image.crossOrigin = 'Anonymous'
              $image.onload = () => {
                resolve({
                  width: $image.naturalWidth,
                  height: $image.naturalHeight,
                  src: item.src,
                  type: $image.src.split('.').pop() || '',
                  accent: getDominantColor($image),
                })
              }
              $image.onerror = (err) => {
                reject(err)
              }
            })
          }),
        )

        loading.value = false

        props.onChange(imagesDetail)
      } catch (err) {
        console.error(err)
      } finally {
        loading.value = false
      }
    }

    return () => (
      <div class="relative w-full flex flex-col flex-grow">
        <div class="flex justify-between space-x-2 items-center">
          <div class="flex-grow flex-shrink inline-block">
            调整 Markdown 中包含的图片信息
          </div>
          <NButton
            loading={loading.value}
            class="self-end"
            round
            onClick={handleCorrectImage}
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
                  <span class="w-full flex flex-shrink break-all">
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

                  <NFormItem label="操作">
                    <div class="flex justify-end w-full">
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
