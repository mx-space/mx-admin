import {
  ChevronDown as ChevronDownIcon,
  Info as InfoIcon,
} from 'lucide-vue-next'
import { NInput, NSelect, NSwitch, NTooltip } from 'naive-ui'
import { computed, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import type { SnippetModel } from '../../../../models/snippet'

import { KVEditor } from '~/components/kv-editor'

import { SnippetType } from '../../../../models/snippet'

// 可折叠分组（仅用于 Secret 等需要折叠的部分）
const CollapsibleSection = defineComponent({
  props: {
    title: { type: String, required: true },
    defaultOpen: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    const isOpen = ref(props.defaultOpen)

    return () => (
      <div class="rounded-md border border-neutral-200 dark:border-neutral-700">
        <button
          type="button"
          class="flex w-full items-center justify-between px-3 py-2 text-left"
          onClick={() => (isOpen.value = !isOpen.value)}
        >
          <span class="text-sm text-neutral-600 dark:text-neutral-400">
            {props.title}
          </span>
          <ChevronDownIcon
            class={[
              'h-4 w-4 text-neutral-400 transition-transform',
              isOpen.value && 'rotate-180',
            ]}
          />
        </button>
        {isOpen.value && (
          <div class="border-t border-neutral-200 p-3 dark:border-neutral-700">
            {slots.default?.()}
          </div>
        )}
      </div>
    )
  },
})

// 表单项
const FormField = defineComponent({
  props: {
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
    tooltip: { type: String },
  },
  setup(props, { slots }) {
    return () => (
      <div class="space-y-1.5">
        <div class="flex items-center gap-1">
          <label class="text-sm text-neutral-600 dark:text-neutral-400">
            {props.label}
          </label>
          {props.required && <span class="text-xs text-red-500/80">*</span>}
          {props.tooltip && (
            <NTooltip>
              {{
                trigger: () => (
                  <InfoIcon class="h-3 w-3 cursor-help text-neutral-400" />
                ),
                default: () => props.tooltip,
              }}
            </NTooltip>
          )}
        </div>
        {slots.default?.()}
      </div>
    )
  },
})

// Switch 行
const SwitchRow = defineComponent({
  props: {
    value: { type: Boolean, required: true },
    label: { type: String, required: true },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    return () => (
      <div
        class={[
          'flex items-center justify-between',
          props.disabled && 'opacity-50',
        ]}
      >
        <span class="text-sm text-neutral-600 dark:text-neutral-400">
          {props.label}
        </span>
        <NSwitch
          value={props.value}
          onUpdateValue={(v) => emit('update:value', v)}
          disabled={props.disabled}
        />
      </div>
    )
  },
})

export const SnippetMetaForm = defineComponent({
  name: 'SnippetMetaForm',
  props: {
    data: {
      type: Object as PropType<SnippetModel>,
      required: true,
    },
    isBuiltFunction: {
      type: Boolean,
      default: false,
    },
    isFunctionType: {
      type: Boolean,
      default: false,
    },
    isEditing: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:data'],
  setup(props, { emit }) {
    const updateField = <K extends keyof SnippetModel>(
      key: K,
      value: SnippetModel[K],
    ) => {
      emit('update:data', { ...props.data, [key]: value })
    }

    const typeOptions = computed(() =>
      Object.entries(SnippetType).map(([k, v]) => ({
        label: k,
        value: v,
      })),
    )

    const methodOptions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ALL'].map(
      (v) => ({ label: v, value: v }),
    )

    return () => (
      <div class="space-y-4 p-1">
        {/* 内置函数提示 */}
        {props.isBuiltFunction && (
          <div class="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 dark:bg-amber-950/50">
            <InfoIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-500" />
            <span class="text-xs text-amber-700 dark:text-amber-400">
              这是一个内置函数，无法修改元信息，但你可以自定义函数实现。
            </span>
          </div>
        )}

        {/* 基础字段 */}
        <div class="grid grid-cols-2 gap-x-4 gap-y-4">
          <FormField label="名称" required>
            <NInput
              value={props.data.name}
              onUpdateValue={(v) => updateField('name', v)}
              disabled={props.isBuiltFunction}
              placeholder="片段名称"
              size="small"
            />
          </FormField>

          <FormField label="引用" required tooltip="用于分组和 API 调用">
            <NInput
              value={props.data.reference}
              onUpdateValue={(v) => updateField('reference', v)}
              disabled={props.isBuiltFunction}
              placeholder="分组标识"
              size="small"
            />
          </FormField>

          <FormField label="类型">
            <NSelect
              value={props.data.type}
              onUpdateValue={(v) => updateField('type', v)}
              options={typeOptions.value}
              disabled={props.isEditing && props.isFunctionType}
              size="small"
            />
          </FormField>

          {props.isFunctionType ? (
            <FormField label="方法">
              <NSelect
                value={props.data.method}
                onUpdateValue={(v) => updateField('method', v)}
                options={methodOptions}
                disabled={props.isBuiltFunction}
                size="small"
              />
            </FormField>
          ) : (
            <FormField label="元类型" tooltip="可选的内容类型标识">
              <NInput
                value={props.data.metatype}
                onUpdateValue={(v) => updateField('metatype', v)}
                placeholder="可选"
                size="small"
              />
            </FormField>
          )}
        </div>

        {/* Schema（仅非函数类型） */}
        {!props.isFunctionType && (
          <FormField label="Schema" tooltip="JSON Schema 验证地址">
            <NInput
              value={props.data.schema}
              onUpdateValue={(v) => updateField('schema', v)}
              placeholder="JSON Schema URL"
              size="small"
            />
          </FormField>
        )}

        {/* 开关选项 */}
        <div class="space-y-3 rounded-md bg-neutral-50 p-3 dark:bg-neutral-800/30">
          <SwitchRow
            value={!props.data.private}
            label="公开访问"
            disabled={props.isBuiltFunction}
            onUpdate:value={(v) => updateField('private', !v)}
          />

          {props.isFunctionType && (
            <SwitchRow
              value={props.data.enable ?? true}
              label="启用函数"
              disabled={props.isBuiltFunction}
              onUpdate:value={(v) => updateField('enable', v)}
            />
          )}
        </div>

        {/* 备注 */}
        <FormField label="备注">
          <NInput
            value={props.data.comment}
            onUpdateValue={(v) => updateField('comment', v)}
            type="textarea"
            rows={2}
            placeholder="添加备注说明…"
            size="small"
          />
        </FormField>

        {/* Secret 环境变量（可折叠） */}
        {props.isFunctionType && (
          <CollapsibleSection title="Secret 环境变量">
            <KVEditor
              key={props.data.id}
              plainKeyInput
              onChange={(kv) => updateField('secret', kv)}
              value={props.data.secret || {}}
            />
          </CollapsibleSection>
        )}
      </div>
    )
  },
})
