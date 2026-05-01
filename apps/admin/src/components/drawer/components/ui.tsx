/**
 * Drawer 统一 UI 组件系统
 * 提供一致的视觉语言和交互模式
 */
import { NSwitch } from 'naive-ui'
import { defineComponent, h } from 'vue'
import type { Component, PropType } from 'vue'

/**
 * 分组标题
 */
export const SectionTitle = defineComponent({
  props: {
    icon: {
      type: Object as PropType<Component>,
      required: false,
    },
  },
  setup(props, { slots }) {
    return () => (
      <div class="mb-4 mt-8 flex items-center gap-2 first:mt-0">
        {props.icon &&
          h(props.icon, {
            class: 'size-4 text-neutral-400',
            'aria-hidden': 'true',
          })}
        <span class="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {slots.default?.()}
        </span>
      </div>
    )
  },
})

/**
 * 表单字段 - Label 在上方
 */
export const FormField = defineComponent({
  props: {
    label: {
      type: String,
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: false,
    },
  },
  setup(props, { slots }) {
    return () => (
      <div class="mb-3">
        <label class="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">
          {props.label}
          {props.required && <span class="ml-0.5 text-red-500">*</span>}
        </label>
        {props.description && (
          <p class="mb-1 text-xs text-neutral-400">{props.description}</p>
        )}
        <div class="w-full">{slots.default?.()}</div>
      </div>
    )
  },
})

/**
 * Switch 行 - 用于开关类设置项，label 和 switch 两端对齐
 */
export const SwitchRow = defineComponent({
  props: {
    label: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    modelValue: {
      type: Boolean,
      required: true,
    },
    onUpdate: {
      type: Function as PropType<(value: boolean) => void>,
      required: true,
    },
    checkedText: {
      type: String,
      required: false,
    },
    uncheckedText: {
      type: String,
      required: false,
    },
  },
  setup(props) {
    return () => (
      <div
        class="-mx-2 flex cursor-pointer items-center justify-between px-2 py-2"
        onClick={() => props.onUpdate(!props.modelValue)}
        role="switch"
        aria-checked={props.modelValue}
        aria-label={props.label}
        tabindex={0}
        onKeydown={(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            props.onUpdate(!props.modelValue)
          }
        }}
      >
        <div class="flex flex-col">
          <span class="text-xs text-neutral-600 dark:text-neutral-300">
            {props.label}
          </span>
          {props.description && (
            <span class="text-xs text-neutral-400">{props.description}</span>
          )}
        </div>
        <div onClick={(e: MouseEvent) => e.stopPropagation()}>
          <NSwitch
            value={props.modelValue}
            onUpdateValue={props.onUpdate}
            size="small"
          >
            {props.checkedText || props.uncheckedText
              ? {
                  checked: () => props.checkedText,
                  unchecked: () => props.uncheckedText,
                }
              : undefined}
          </NSwitch>
        </div>
      </div>
    )
  },
})

/**
 * 内联字段行 - Label 和控件在同一行
 */
export const InlineField = defineComponent({
  props: {
    label: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
  },
  setup(props, { slots }) {
    return () => (
      <div class="mb-4 flex items-start justify-between gap-4">
        <div class="flex flex-col pt-1.5">
          <span class="text-sm text-neutral-600 dark:text-neutral-300">
            {props.label}
          </span>
          {props.description && (
            <span class="text-xs text-neutral-400">{props.description}</span>
          )}
        </div>
        <div class="flex-1">{slots.default?.()}</div>
      </div>
    )
  },
})

/**
 * 字段组 - 用于将多个相关字段组合在一起
 */
export const FieldGroup = defineComponent({
  props: {
    label: {
      type: String,
      required: false,
    },
  },
  setup(props, { slots }) {
    return () => (
      <div class="mb-4 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
        {props.label && (
          <div class="mb-2 text-xs font-medium text-neutral-500">
            {props.label}
          </div>
        )}
        {slots.default?.()}
      </div>
    )
  },
})

/**
 * 操作按钮组
 */
export const ActionRow = defineComponent({
  props: {
    label: {
      type: String,
      required: false,
    },
  },
  setup(props, { slots }) {
    return () => (
      <div class="mb-4 flex items-center justify-between">
        {props.label && (
          <span class="text-sm text-neutral-600 dark:text-neutral-300">
            {props.label}
          </span>
        )}
        <div class={props.label ? '' : 'w-full'}>{slots.default?.()}</div>
      </div>
    )
  },
})

/**
 * 分隔线
 */
export const Divider = defineComponent({
  setup() {
    return () => <div class="my-4 h-px bg-neutral-100 dark:bg-neutral-800" />
  },
})

/**
 * 信息展示
 */
export const InfoDisplay = defineComponent({
  props: {
    label: {
      type: String,
      required: true,
    },
  },
  setup(props, { slots }) {
    return () => (
      <div class="mb-2 flex items-center justify-between text-sm">
        <span class="text-neutral-500">{props.label}</span>
        <span class="text-neutral-700 dark:text-neutral-200">
          {slots.default?.()}
        </span>
      </div>
    )
  },
})
