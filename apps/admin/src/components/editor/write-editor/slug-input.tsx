/**
 * Slug 输入行组件
 * 用于 WriteEditor 的副标题区域
 */

import { Copy } from 'lucide-vue-next'
import { NTooltip } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import type { PropType, VNode } from 'vue'

export const SlugInput = defineComponent({
  name: 'SlugInput',
  props: {
    prefix: {
      type: String,
      default: '',
    },
    value: {
      type: String,
      required: true,
    },
    onChange: {
      type: Function as PropType<(value: string) => void>,
      required: true,
    },
    placeholder: {
      type: String,
      default: 'slug',
    },
    // 额外的操作按钮
    extraActions: {
      type: [Object, Function] as PropType<VNode | (() => VNode)>,
    },
  },
  setup(props, { slots }) {
    const inputRef = ref<HTMLInputElement>()
    const copied = ref(false)

    const handleCopy = async () => {
      const fullUrl = props.prefix + props.value
      await navigator.clipboard.writeText(fullUrl)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    }

    return () => (
      <div class="flex items-center gap-2 text-sm text-neutral-500">
        {props.prefix && (
          <span class="select-none text-neutral-400">{props.prefix}</span>
        )}

        <input
          ref={inputRef}
          value={props.value}
          onInput={(e) => {
            props.onChange((e.target as HTMLInputElement).value)
          }}
          placeholder={props.placeholder}
          class={[
            'bg-transparent outline-none',
            'border-b border-transparent',
            'text-neutral-600 dark:text-neutral-400',
            'min-w-[80px] px-0.5',
            'transition-colors duration-150',
            'hover:border-neutral-200 dark:hover:border-neutral-700',
            'focus:border-neutral-400 dark:focus:border-neutral-500',
            'placeholder:text-neutral-400 dark:placeholder:text-neutral-600',
          ]}
          style={{
            width: `${Math.max(props.value?.length || 4, 4) * 8 + 16}px`,
          }}
        />

        {/* 复制按钮 */}
        {props.value && (
          <NTooltip trigger="hover" placement="top" showArrow={false}>
            {{
              trigger: () => (
                <button
                  onClick={handleCopy}
                  class={[
                    'flex items-center justify-center',
                    'size-6 rounded',
                    'text-neutral-400 dark:text-neutral-500',
                    'transition-colors duration-150',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    'hover:text-neutral-600 dark:hover:text-neutral-400',
                  ]}
                >
                  <Copy size={14} />
                </button>
              ),
              default: () => (
                <span class="text-xs">
                  {copied.value ? '已复制' : '复制链接'}
                </span>
              ),
            }}
          </NTooltip>
        )}

        {/* 额外操作 */}
        {slots.default?.()}
        {typeof props.extraActions === 'function'
          ? props.extraActions()
          : props.extraActions}
      </div>
    )
  },
})
