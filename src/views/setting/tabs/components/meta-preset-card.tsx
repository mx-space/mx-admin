/**
 * Meta Preset Card Component
 * Meta 预设字段列表项卡片
 */
import {
  GripVertical as GripVerticalIcon,
  Lock as LockIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon,
} from 'lucide-vue-next'
import { NButton, NPopconfirm, NSwitch, NTag } from 'naive-ui'
import { defineComponent } from 'vue'
import type {
  MetaFieldType,
  MetaPresetField,
  MetaPresetScope,
} from '~/models/meta-preset'
import type { PropType } from 'vue'

/**
 * 字段类型标签文本映射
 */
const fieldTypeLabels: Record<MetaFieldType, string> = {
  text: '文本',
  textarea: '多行文本',
  number: '数字',
  url: 'URL',
  select: '单选',
  'multi-select': '多选',
  checkbox: '复选框',
  tags: '标签',
  boolean: '开关',
  object: '对象',
}

/**
 * 作用域标签文本映射
 */
const scopeLabels: Record<MetaPresetScope, string> = {
  post: '博文',
  note: '笔记',
  both: '通用',
}

/**
 * 作用域标签颜色映射
 */
const scopeColors: Record<MetaPresetScope, 'info' | 'success' | 'warning'> = {
  post: 'info',
  note: 'success',
  both: 'warning',
}

export const MetaPresetCard = defineComponent({
  name: 'MetaPresetCard',
  props: {
    preset: {
      type: Object as PropType<MetaPresetField>,
      required: true,
    },
    onEdit: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
    onToggleEnabled: {
      type: Function as PropType<(preset: MetaPresetField) => void>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="group flex items-center gap-3 border-b border-neutral-200 px-4 py-3 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50">
        {/* 拖拽手柄 */}
        {!props.preset.isBuiltin && (
          <div class="shrink-0 cursor-grab text-neutral-300 dark:text-neutral-600">
            <GripVerticalIcon class="size-4" />
          </div>
        )}

        {/* 内容 */}
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-neutral-900 dark:text-neutral-100">
              {props.preset.label}
            </span>
            <code class="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              {props.preset.key}
            </code>
            {props.preset.isBuiltin && (
              <NTag size="tiny" type="default" round>
                {{
                  icon: () => <LockIcon class="size-3" />,
                  default: () => <span class="text-xs">内置</span>,
                }}
              </NTag>
            )}
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <NTag size="tiny" type="info" bordered={false}>
              {fieldTypeLabels[props.preset.type]}
            </NTag>
            <NTag
              size="tiny"
              type={scopeColors[props.preset.scope]}
              bordered={false}
            >
              {scopeLabels[props.preset.scope]}
            </NTag>
            {props.preset.description && (
              <span class="truncate">{props.preset.description}</span>
            )}
          </div>
        </div>

        {/* 操作区域 */}
        <div class="ml-auto flex shrink-0 items-center gap-2">
          {/* 启用/禁用开关 */}
          <NSwitch
            size="small"
            value={props.preset.enabled}
            onUpdateValue={() => props.onToggleEnabled(props.preset)}
          />

          {/* 编辑按钮 */}
          {!props.preset.isBuiltin && (
            <NButton
              size="tiny"
              quaternary
              type="primary"
              onClick={() => props.onEdit(props.preset.id)}
            >
              <PencilIcon class="size-3.5" />
            </NButton>
          )}

          {/* 删除按钮 */}
          {!props.preset.isBuiltin && (
            <NPopconfirm
              onPositiveClick={() => props.onDelete(props.preset.id)}
              positiveText="删除"
              negativeText="取消"
            >
              {{
                trigger: () => (
                  <NButton size="tiny" quaternary type="error">
                    <Trash2Icon class="size-3.5" />
                  </NButton>
                ),
                default: () => (
                  <span>确定要删除预设字段「{props.preset.label}」吗？</span>
                ),
              }}
            </NPopconfirm>
          )}
        </div>
      </div>
    )
  },
})
