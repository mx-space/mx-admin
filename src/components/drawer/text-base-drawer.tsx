import { JSONHighlight } from 'components/json-highlight'
import { useAsyncLoadMonaco } from 'hooks/use-async-monaco'
import type { Image as ImageModel } from 'models/base'
import {
  NButton,
  NButtonGroup,
  NCollapse,
  NCollapseItem,
  NColorPicker,
  NDivider,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSwitch,
  useDialog,
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
    const modal = useDialog()

    const showJSONEditorModal = ref(false)
    const handleEdit = () => {
      showJSONEditorModal.value = true
    }
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

            <NDivider />

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
            <NDivider />
            <NFormItem label="附加字段" labelPlacement="left">
              <div class="flex-grow text-right">
                <NButton onClick={handleEdit} round>
                  编辑
                </NButton>
              </div>
            </NFormItem>

            {props.data.meta && (
              <NCollapse accordion>
                <NCollapseItem title="预览">
                  <JSONHighlight
                    class="max-w-full overflow-auto"
                    code={JSON.stringify(props.data.meta, null, 2)}
                  />
                </NCollapseItem>
              </NCollapse>
            )}
          </NForm>
        </NDrawerContent>

        <NModal
          show={showJSONEditorModal.value}
          zIndex={2222}
          preset="card"
          closable
          closeOnEsc={false}
          title="编辑附加字段"
          onClose={() => {
            showJSONEditorModal.value = false
          }}
          class="w-[unset]"
        >
          <JSONEditor
            value={
              props.data.meta ? JSON.stringify(props.data.meta, null, 2) : ''
            }
            onFinish={(jsonString) => {
              try {
                const parsed = JSON.parse(jsonString)

                console.log(parsed)

                props.data.meta = parsed

                showJSONEditorModal.value = false
              } catch (er: any) {
                message.error(er.message)
              }
            }}
          />
        </NModal>
      </NDrawer>
    )
  },
})

const JSONEditorProps = {
  value: {
    type: String,
    required: true,
  },

  onFinish: {
    type: Function as PropType<(s: string) => void>,
    required: true,
  },
} as const
const JSONEditor = defineComponent({
  props: JSONEditorProps,

  setup(props) {
    const htmlRef = ref<HTMLElement>()
    const refValue = ref(props.value)
    const editor = useAsyncLoadMonaco(
      htmlRef,
      refValue,
      (val) => {
        refValue.value = val
      },
      {
        language: 'json',
      },
    )
    const handleFinish = () => {
      props.onFinish(refValue.value)
    }
    return () => {
      const { Snip } = editor
      return (
        <div class="max-w-[60vw] w-[600px] max-h-[70vh] h-[500px] flex flex-col gap-2">
          <div ref={htmlRef} class="flex-shrink-0 flex-grow">
            <Snip />
          </div>

          <div class="text-right flex-shrink-0">
            <NButton round type="primary" onClick={handleFinish}>
              提交
            </NButton>
          </div>
        </div>
      )
    }
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
