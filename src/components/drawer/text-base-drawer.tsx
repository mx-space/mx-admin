import { isURL } from 'class-validator'
import { isObject, isUndefined } from 'es-toolkit/compat'
import {
  BracesIcon,
  ChevronDownIcon,
  ImageIcon,
  SettingsIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NCollapse,
  NCollapseItem,
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NDynamicInput,
  NImage,
  NInput,
  NModal,
  NPopover,
  NSelect,
  NTooltip,
} from 'naive-ui'
import type { Image } from '@mx-space/api-client'
import type { SelectOption } from 'naive-ui'
import type { PropType } from 'vue'

import { JSONHighlight } from '~/components/json-highlight'
import { JSONParseReturnOriginal } from '~/utils/json'

import { ImageDetailSection } from './components/image-detail-section'
import { JSONEditor } from './components/json-editor'
import { FormField, SectionTitle, SwitchRow } from './components/ui'

// 重新导出 UI 组件，方便外部使用
export {
  ActionRow,
  Divider,
  FieldGroup,
  FormField,
  InlineField,
  SectionTitle,
  SwitchRow,
} from './components/ui'

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

    title: {
      type: String,
      default: '文章设定',
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

    // 附加字段展开状态
    const metaExpanded = ref(false)

    return () => (
      <NDrawer
        show={props.show}
        width={450}
        class="max-w-[90vw]"
        placement="right"
        onUpdateShow={props.onUpdateShow}
      >
        <NDrawerContent
          title={props.title}
          closable
          nativeScrollbar={false}
          bodyContentClass="!p-0"
        >
          <div class="px-5 py-4">
            {/* 外部传入的内容 (特定设置) */}
            {slots.default?.()}

            {/* 基础设置 */}
            <SectionTitle icon={SettingsIcon}>基础设置</SectionTitle>

            <SwitchRow
              label="允许评论"
              modelValue={props.data.allowComment}
              onUpdate={(e) => void (props.data.allowComment = e)}
            />

            {!disabledItem.has('date-picker') && (
              <FormField label="自定义创建时间">
                <NDatePicker
                  class="w-full"
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
              </FormField>
            )}

            {/* 图片设置 */}
            <SectionTitle icon={ImageIcon}>图片设置</SectionTitle>

            <FormField label="文章缩略图">
              <ImageCoverInput
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
            </FormField>

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

            {/* 附加字段 */}
            <SectionTitle icon={BracesIcon}>附加字段</SectionTitle>

            <button
              type="button"
              class="mb-3 flex w-full items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
              onClick={() => (metaExpanded.value = !metaExpanded.value)}
              aria-expanded={metaExpanded.value}
            >
              <span class="text-sm text-neutral-600 dark:text-neutral-300">
                自定义 Meta 数据
                {props.data.meta && Object.keys(props.data.meta).length > 0 && (
                  <span class="ml-2 text-xs text-neutral-400">
                    ({Object.keys(props.data.meta).length} 项)
                  </span>
                )}
              </span>
              <div class="flex items-center gap-2">
                <NButton
                  size="tiny"
                  quaternary
                  type="primary"
                  onClick={(e: MouseEvent) => {
                    e.stopPropagation()
                    handleEdit()
                  }}
                >
                  JSON 编辑
                </NButton>
                <ChevronDownIcon
                  class={[
                    'size-4 text-neutral-400 transition-transform',
                    metaExpanded.value && 'rotate-180',
                  ]}
                />
              </div>
            </button>

            {metaExpanded.value && (
              <div class="space-y-3">
                <NDynamicInput
                  preset="pair"
                  value={keyValuePairs.value}
                  keyPlaceholder="字段名"
                  valuePlaceholder="字段值"
                  onUpdateValue={(value: any[]) => {
                    keyValuePairs.value = value
                  }}
                />

                {props.data.meta && Object.keys(props.data.meta).length > 0 && (
                  <NCollapse accordion>
                    <NCollapseItem title="预览 JSON">
                      <JSONHighlight
                        class="max-w-full overflow-auto rounded-lg bg-neutral-50 p-3 text-xs dark:bg-neutral-800/50"
                        code={JSON.stringify(props.data.meta, null, 2)}
                      />
                    </NCollapseItem>
                  </NCollapse>
                )}
              </div>
            )}
          </div>
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
                props.data.meta = parsed
                showJSONEditorModal.value = false
              } catch (error: any) {
                message.error(error.message)
              }
            }}
          />
        </NModal>
      </NDrawer>
    )
  },
})

/**
 * 图片封面输入组件
 */
const ImageCoverInput = defineComponent({
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
      required: false,
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
                class="w-full"
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
                placeholder="选择或输入图片 URL"
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
                          alt="缩略图预览"
                          width={400}
                        />
                      ),
                    },
                  )
                }
              />
            ) : (
              <NInput
                class="w-full"
                value={props.value}
                status={isValidated.value ? undefined : 'error'}
                onUpdateValue={validateAndCallback}
                placeholder="输入图片 URL (https://...)"
              />
            )
          },
          default() {
            if (!props.value) return null
            return <NImage src={props.value} alt="封面预览" width={400} />
          },
        }}
      </NPopover>
    )
  },
})
