/**
 * Say List Item Component
 * 一言列表项组件 - 引用风格设计
 */
import { Pencil, Quote, Trash2, User, X } from 'lucide-vue-next'
import { NButton, NInput, NModal, NPopconfirm } from 'naive-ui'
import type { SayModel } from '~/models/say'
import type { PropType } from 'vue'

import { RelativeTime } from '~/components/time/relative-time'
import { RESTManager } from '~/utils'

interface SayWithMeta extends SayModel {
  created?: string
  modified?: string
}

export const SayListItem = defineComponent({
  name: 'SayListItem',
  props: {
    say: {
      type: Object as PropType<SayWithMeta>,
      required: true,
    },
    onEdit: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="group border-b border-neutral-200 px-4 py-4 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50">
        {/* 内容区 */}
        <div class="flex gap-3">
          {/* 引号图标 */}
          <div class="shrink-0 pt-0.5">
            <Quote
              class="size-5 text-neutral-300 dark:text-neutral-600"
              aria-hidden="true"
            />
          </div>

          {/* 主内容 */}
          <div class="min-w-0 flex-1">
            {/* 引用文本 */}
            <p class="text-base leading-relaxed text-neutral-800 dark:text-neutral-200">
              {props.say.text}
            </p>

            {/* 元信息 */}
            <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
              {props.say.author && (
                <span class="flex items-center gap-1">
                  <User class="size-3.5" aria-hidden="true" />
                  {props.say.author}
                </span>
              )}
              {props.say.source && (
                <span class="text-neutral-400 dark:text-neutral-500">
                  —— {props.say.source}
                </span>
              )}
              {props.say.created && (
                <RelativeTime
                  time={props.say.created}
                  class="text-neutral-400 dark:text-neutral-500"
                />
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div class="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <NButton
              size="tiny"
              quaternary
              type="primary"
              onClick={props.onEdit}
              aria-label="编辑一言"
            >
              {{
                icon: () => <Pencil class="size-3.5" />,
                default: () => <span class="hidden sm:inline">编辑</span>,
              }}
            </NButton>

            <NPopconfirm onPositiveClick={() => props.onDelete(props.say.id!)}>
              {{
                trigger: () => (
                  <NButton
                    size="tiny"
                    quaternary
                    type="error"
                    aria-label="删除一言"
                  >
                    <Trash2 class="size-3.5" />
                  </NButton>
                ),
                default: () => (
                  <span class="max-w-64 break-all">
                    确定要删除「{props.say.text.slice(0, 30)}
                    {props.say.text.length > 30 ? '…' : ''}」吗？
                  </span>
                ),
              }}
            </NPopconfirm>
          </div>
        </div>
      </div>
    )
  },
})

/**
 * Say Edit Modal
 */
export const SayEditModal = defineComponent({
  name: 'SayEditModal',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    say: {
      type: Object as PropType<SayWithMeta | null>,
      default: null,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onSuccess: {
      type: Function as PropType<(say: SayWithMeta) => void>,
      required: true,
    },
  },
  setup(props) {
    const form = reactive({
      text: '',
      author: '',
      source: '',
    })
    const submitting = ref(false)
    const textError = ref('')

    // 当 say 变化或 modal 打开时，重置表单
    watch(
      () => [props.show, props.say],
      ([show, say]) => {
        if (show) {
          if (say) {
            form.text = (say as SayWithMeta).text || ''
            form.author = (say as SayWithMeta).author || ''
            form.source = (say as SayWithMeta).source || ''
          } else {
            form.text = ''
            form.author = ''
            form.source = ''
          }
          textError.value = ''
        }
      },
      { immediate: true },
    )

    const isEdit = computed(() => !!props.say?.id)

    const handleSubmit = async () => {
      // 验证
      if (!form.text.trim()) {
        textError.value = '请输入内容'
        return
      }
      textError.value = ''

      submitting.value = true
      try {
        let result: SayWithMeta
        const data = {
          text: form.text.trim(),
          author: form.author.trim() || undefined,
          source: form.source.trim() || undefined,
        }

        if (isEdit.value) {
          result = await RESTManager.api.says(props.say!.id!).put({ data })
          message.success('修改成功')
        } else {
          result = await RESTManager.api.says.post({ data })
          message.success('发布成功')
        }

        props.onSuccess(result)
      } finally {
        submitting.value = false
      }
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSubmit()
      }
    }

    return () => (
      <NModal
        show={props.show}
        onUpdateShow={(show) => {
          if (!show) props.onClose()
        }}
        closeOnEsc
        transformOrigin="center"
      >
        <div
          class="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-neutral-900"
          role="dialog"
          aria-modal="true"
          aria-labelledby="say-modal-title"
          onKeydown={handleKeydown}
        >
          {/* Header */}
          <div class="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <h2
              id="say-modal-title"
              class="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
            >
              {isEdit.value ? '编辑一言' : '添加一言'}
            </h2>
            <button
              type="button"
              class="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              onClick={props.onClose}
              aria-label="关闭"
            >
              <X class="size-5" />
            </button>
          </div>

          {/* Body */}
          <div class="px-5 py-4">
            {/* 内容 */}
            <div class="mb-4">
              <label class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                内容 <span class="text-red-500">*</span>
              </label>
              <NInput
                type="textarea"
                value={form.text}
                onUpdateValue={(v) => (form.text = v)}
                placeholder="记录一句有意思的话…"
                autosize={{ minRows: 3, maxRows: 8 }}
                status={textError.value ? 'error' : undefined}
              />
              {textError.value && (
                <p class="mt-1 text-xs text-red-500">{textError.value}</p>
              )}
            </div>

            {/* 作者 */}
            <div class="mb-4">
              <label class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                作者
              </label>
              <NInput
                value={form.author}
                onUpdateValue={(v) => (form.author = v)}
                placeholder="谁说的？"
              />
            </div>

            {/* 来源 */}
            <div class="mb-4">
              <label class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                来源
              </label>
              <NInput
                value={form.source}
                onUpdateValue={(v) => (form.source = v)}
                placeholder="出自哪里？"
              />
            </div>
          </div>

          {/* Footer */}
          <div class="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <span class="mr-auto text-xs text-neutral-400">
              Cmd/Ctrl + Enter 快速保存
            </span>
            <NButton onClick={props.onClose}>取消</NButton>
            <NButton
              type="primary"
              loading={submitting.value}
              onClick={handleSubmit}
            >
              {isEdit.value ? '保存' : '发布'}
            </NButton>
          </div>
        </div>
      </NModal>
    )
  },
})

/**
 * Empty State for Says
 */
export const SayEmptyState = defineComponent({
  name: 'SayEmptyState',
  props: {
    onCreate: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-16 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <Quote class="size-8 text-neutral-400" aria-hidden="true" />
        </div>
        <h3 class="mb-1 text-lg font-medium text-neutral-900 dark:text-neutral-100">
          暂无一言
        </h3>
        <p class="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          记录一些有意思的话语吧
        </p>
        <NButton type="primary" onClick={props.onCreate}>
          添加第一条一言
        </NButton>
      </div>
    )
  },
})

/**
 * Loading Skeleton for Say List
 */
export const SayListSkeleton = defineComponent({
  name: 'SayListSkeleton',
  setup() {
    return () => (
      <div class="animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            class="flex gap-3 border-b border-neutral-200 px-4 py-4 last:border-b-0 dark:border-neutral-800"
          >
            <div class="size-5 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div class="flex-1">
              <div class="h-5 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
              <div class="mt-2 h-5 w-3/4 rounded bg-neutral-100 dark:bg-neutral-800" />
              <div class="mt-3 flex gap-4">
                <div class="h-4 w-20 rounded bg-neutral-100 dark:bg-neutral-800" />
                <div class="h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  },
})
