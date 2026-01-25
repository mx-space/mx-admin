import { BracesIcon, ImageIcon, SettingsIcon } from 'lucide-vue-next'
import {
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NImage,
  NInput,
  NPopover,
  NSelect,
  NTooltip,
} from 'naive-ui'
import isURL from 'validator/lib/isURL'
import { defineComponent, h, ref } from 'vue'
import type { Image } from '@mx-space/api-client'
import type { MetaPresetScope } from '~/models/meta-preset'
import type { SelectOption } from 'naive-ui'
import type { PropType, VNode } from 'vue'

import { ImageDetailSection } from './components/image-detail-section'
import { MetaPresetSection } from './components/meta-preset-section'
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

    /**
     * 元数据预设字段的适用范围
     */
    scope: {
      type: String as PropType<MetaPresetScope>,
      default: 'both',
    },
  },
  setup(props, { slots }) {
    const disabledItem = new Set(props.disabledItem || [])

    // 更新 meta 数据
    const handleUpdateMeta = (meta: Record<string, any> | undefined) => {
      props.data.meta = meta
    }

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
                    // 如果 meta 为空对象，设为 undefined
                    if (Object.keys(props.data.meta).length === 0) {
                      props.data.meta = undefined
                    }
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

            <MetaPresetSection
              meta={props.data.meta}
              onUpdateMeta={handleUpdateMeta}
              scope={props.scope}
            />
          </div>
        </NDrawerContent>
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
            const validImages = (props.images as Image[]).filter(
              (img) => img?.src,
            )
            return validImages.length > 0 ? (
              <NSelect
                class="w-full"
                status={isValidated.value ? undefined : 'error'}
                value={props.value}
                onUpdateValue={validateAndCallback}
                options={validImages.map((image) => ({
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
