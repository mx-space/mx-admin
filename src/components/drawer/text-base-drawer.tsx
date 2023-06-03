import { isURL } from 'class-validator'
import { JSONHighlight } from 'components/json-highlight'
import { isObject, isUndefined } from 'lodash-es'
import type { SelectOption } from 'naive-ui'
import {
  NButton,
  NCollapse,
  NCollapseItem,
  NDatePicker,
  NDivider,
  NDrawer,
  NDrawerContent,
  NDynamicInput,
  NForm,
  NFormItem,
  NImage,
  NInput,
  NModal,
  NPopover,
  NSelect,
  NSwitch,
  NTooltip,
} from 'naive-ui'
import { JSONParseReturnOriginal } from 'utils/json'
import type { PropType } from 'vue'
import type { Image } from '@mx-space/api-client'
import { ImageDetailSection } from './components/image-detail-section'
import { JSONEditor } from './components/json-editor'

type ItemType = 'date-picker'
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

    labelWidth: {
      type: Number,
      required: false,
    },

    disabledItem: {
      type: Array as PropType<ItemType[]>,
      required: false,
    },
  },
  setup(props, { slots }) {
    const disabledItem = new Set(props.disabledItem || [])

    const showJSONEditorModal = ref(false)
    const handleEdit = () => {
      showJSONEditorModal.value = true
    }

    const keyValuePairs = ref([] as { key: string; value: string }[])

    let inUpdatedKeyValue = false

    watch(
      () => keyValuePairs.value,
      () => {
        inUpdatedKeyValue = true
        props.data.meta = keyValuePairs.value.reduce((acc, { key, value }) => {
          return isUndefined(value) || value === ''
            ? acc
            : { ...acc, [key]: JSONParseReturnOriginal(value) }
        }, {})
      },
    )

    watch(
      () => props.data.meta,
      () => {
        if (inUpdatedKeyValue) {
          inUpdatedKeyValue = false
          return
        }

        if (props.data.meta && isObject(props.data.meta)) {
          keyValuePairs.value = Object.entries(props.data.meta).reduce(
            (acc, [key, value]): any => {
              return [
                ...acc,
                {
                  key,
                  value: JSON.stringify(value),
                },
              ]
            },
            [],
          )
        }
      },
      {
        flush: 'post',
        deep: true,
      },
    )
    return () => (
      <NDrawer
        show={props.show}
        width={450}
        class="max-w-[90vw]"
        placement="right"
        onUpdateShow={props.onUpdateShow}
      >
        <NDrawerContent title="文章设定">
          <NForm
            labelAlign="right"
            labelPlacement="left"
            labelWidth={props.labelWidth ?? 120}
          >
            {slots.default?.()}
            <NFormItem label="允许评论">
              <NSwitch
                value={props.data.allowComment}
                onUpdateValue={(e) => void (props.data.allowComment = e)}
              />
            </NFormItem>

            {!disabledItem.has('date-picker') && (
              <NFormItem label="自定义创建时间">
                <NDatePicker
                  clearable
                  isDateDisabled={(ts: number) => {
                    return ts > Date.now()
                  }}
                  type="datetime"
                  value={
                    props.data.created
                      ? new Date(props.data.created).getTime()
                      : undefined
                  }
                  onUpdateValue={(e) => {
                    const value = e ? new Date(e).toISOString() : undefined
                    props.data.created = value
                  }}
                />
              </NFormItem>
            )}

            <NDivider />

            <ImageCoverItem
              images={props.data.images}
              onChange={(src) => {
                if (!props.data.meta) props.data.meta = {}
                if (src === null) {
                  delete props.data.meta.cover
                  return
                }
                props.data.meta.cover = src
              }}
              value={props.data.meta?.cover}
            />

            <NFormItem label="图片设定" labelAlign="left"></NFormItem>
            <NFormItem>
              <ImageDetailSection
                text={props.data.text}
                images={props.data.images}
                extraImages={
                  props.data.meta?.cover ? [props.data.meta.cover] : undefined
                }
                onChange={(images) => {
                  props.data.images = images
                }}
              />
            </NFormItem>
            <NDivider />
            <NFormItem label="附加字段" labelAlign="left">
              <div class="flex-grow text-right">
                <NButton onClick={handleEdit} round>
                  编辑
                </NButton>
              </div>
            </NFormItem>
            <NDynamicInput
              preset="pair"
              value={keyValuePairs.value}
              keyPlaceholder="附加字段名"
              valuePlaceholder="附加字段值"
              onUpdateValue={(value: any[]) => {
                keyValuePairs.value = value
              }}
            ></NDynamicInput>

            {props.data.meta && (
              <NCollapse accordion class="mt-4">
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
          onUpdateShow={(e) => {
            showJSONEditorModal.value = e
          }}
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
                inUpdatedKeyValue = false
                const parsed = JSON.parse(jsonString)

                // console.log(parsed)

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

const ImageCoverItem = defineComponent({
  props: {
    images: {
      type: Array as PropType<Image[]>,
      required: true,
    },
    onChange: {
      type: Function as PropType<(image: string | null) => void>,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const isValidated = ref(true)
    const validateAndCallback = (value: string) => {
      if (!value) {
        isValidated.value = true
        props.onChange(null)
        return
      }
      if (isURL(value)) isValidated.value = true
      else isValidated.value = false

      props.onChange(value)
    }
    const show = ref(false)
    return () => (
      <NFormItem label="文章缩略图" labelAlign="left">
        <NPopover
          placement="left"
          show={show.value}
          onUpdateShow={(newValue) => {
            if (newValue && !props.value) return
            show.value = newValue
          }}
        >
          {{
            trigger() {
              return props.images.length > 0 ? (
                <NSelect
                  status={isValidated.value ? undefined : 'error'}
                  value={props.value}
                  onUpdateValue={validateAndCallback}
                  options={(props.images as Image[]).map((image) => ({
                    label: image.src,
                    value: image.src,
                  }))}
                  filterable
                  tag
                  clearable
                  maxTagCount={1}
                  renderOption={({
                    node,
                    option,
                  }: {
                    node: VNode
                    option: SelectOption
                  }) =>
                    h(
                      NTooltip,
                      { placement: 'left' },
                      {
                        trigger: () => node,
                        default: () => (
                          <NImage
                            src={option.value as string}
                            alt="popover"
                            width={400}
                          />
                        ),
                      },
                    )
                  }
                ></NSelect>
              ) : (
                <NInput
                  value={props.value}
                  status={isValidated.value ? undefined : 'error'}
                  onUpdateValue={validateAndCallback}
                  placeholder={'https?://...'}
                ></NInput>
              )
            },
            default() {
              if (!props.value) return null
              return <NImage src={props.value} alt="cover" width={400} />
            },
          }}
        </NPopover>
      </NFormItem>
    )
  },
})
