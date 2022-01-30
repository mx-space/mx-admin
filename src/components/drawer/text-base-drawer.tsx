import type { Image as ImageModel } from 'models/base'
import {
  NButton,
  NButtonGroup,
  NCollapse,
  NCollapseItem,
  NColorPicker,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
} from 'naive-ui'
import { getDominantColor } from 'utils/image'
import { pickImagesFromMarkdown } from 'utils/markdown'
import { PropType } from 'vue'
export const TextBaseDrawer = defineComponent({
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    onUpdateShow: {
      type: Function as PropType<(s: boolean) => void>,
      required: true,
    },
    data: {
      type: Object as PropType<any>,
      required: true,
    },
  },
  setup(props, { slots }) {
    return () => (
      <NDrawer
        show={props.show}
        width={450}
        class="max-w-[90vw]"
        placement="right"
        onUpdateShow={props.onUpdateShow}
      >
        <NDrawerContent title="文章设定">
          <NForm labelAlign="right" labelPlacement="left" labelWidth={100}>
            {slots.default?.()}
            <NFormItem label="允许评论">
              <NSwitch
                value={props.data.allowComment}
                onUpdateValue={(e) => void (props.data.allowComment = e)}
              />
            </NFormItem>
            <NFormItem label="图片设定"></NFormItem>
            <NFormItem>
              <ImageDetailSection
                text={props.data.text}
                images={props.data.images}
                onChange={(images) => {
                  props.data.images = images
                }}
              />
            </NFormItem>
          </NForm>
        </NDrawerContent>
      </NDrawer>
    )
  },
})

const ImageDetailSection = defineComponent({
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
    const handleCorrectImage = async () => {
      const images: ImageModel[] = props.text
        ? pickImagesFromMarkdown(props.text).map((src) => ({
            src: src,
            height: 0,
            width: 0,
            type: '',
          }))
        : props.images

      const imagesDetail = await Promise.all(
        images.map((item, i) => {
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

      props.onChange(imagesDetail)
    }

    return () => (
      <div class="relative w-full flex flex-col flex-grow">
        <div class="flex justify-between space-x-2 items-center pr-4">
          <div class="flex-grow flex-shrink inline-block">
            调整 Markdown 中包含的图片信息
          </div>
          <NButton class="self-end" round onClick={handleCorrectImage}>
            自动修正
          </NButton>
        </div>

        <NCollapse accordion class="mt-4">
          {props.images.map((image: ImageModel, index: number) => {
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
