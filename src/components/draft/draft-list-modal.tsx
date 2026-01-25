import { X } from 'lucide-vue-next'
import { NButton, NModal } from 'naive-ui'
import { defineComponent, ref, watch } from 'vue'
import type { DraftModel } from '~/models/draft'
import type { PropType } from 'vue'

import { FilePreview } from './file-preview'

export const DraftListModal = defineComponent({
  name: 'DraftListModal',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
    drafts: {
      type: Array as PropType<DraftModel[]>,
      required: true,
    },
    draftLabel: {
      type: String,
      default: '内容',
    },
    onSelect: {
      type: Function as PropType<(draftId: string) => void>,
      required: true,
    },
    onCreate: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const selectedDraftId = ref<string | null>(null)
    const selectedDraft = ref<DraftModel | null>(null)

    // Default select first draft
    watch(
      () => props.show,
      (show) => {
        if (show && props.drafts.length > 0) {
          selectedDraftId.value = props.drafts[0].id
          selectedDraft.value = props.drafts[0]
        }
      },
      { immediate: true },
    )

    const handleSelectDraft = (draft: DraftModel) => {
      selectedDraftId.value = draft.id
      selectedDraft.value = draft
    }

    const handleCreate = () => {
      props.onCreate()
      props.onClose()
    }

    const handleContinue = () => {
      if (selectedDraftId.value) {
        props.onSelect(selectedDraftId.value)
        props.onClose()
      }
    }

    const formatWordCount = (text: string) => {
      return text.length
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
          class="flex h-[600px] w-[900px] max-w-[90vw] flex-col rounded-xl bg-white shadow-xl dark:bg-neutral-900"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div class="flex flex-shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              发现未完成的草稿
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

          {/* Body - Split View */}
          <div class="flex min-h-0 flex-1">
            {/* Left: Draft List */}
            <div class="w-60 flex-shrink-0 overflow-y-auto border-r border-neutral-200 p-4 dark:border-neutral-800">
              <h3 class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                草稿列表
              </h3>
              <div class="space-y-2">
                {props.drafts.map((draft) => (
                  <div
                    key={draft.id}
                    class={[
                      'cursor-pointer rounded-lg border p-3 transition-all',
                      selectedDraftId.value === draft.id
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800',
                    ]}
                    onClick={() => handleSelectDraft(draft)}
                  >
                    <div class="flex items-start gap-2">
                      <div class="mt-0.5 flex-shrink-0">
                        {selectedDraftId.value === draft.id ? (
                          <div class="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                            <span class="text-xs text-white">✓</span>
                          </div>
                        ) : (
                          <div class="h-4 w-4 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
                        )}
                      </div>

                      <div class="min-w-0 flex-1">
                        <p
                          class={[
                            'truncate text-sm font-medium',
                            selectedDraftId.value === draft.id
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-neutral-900 dark:text-neutral-100',
                          ]}
                        >
                          {draft.title || '无标题'}
                        </p>
                        <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                          v{draft.version} · {formatWordCount(draft.text)} 字
                        </p>
                        <p class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                          {new Date(draft.updated).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Content Preview */}
            <div class="min-w-0 flex-1 p-4">
              <h3 class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                内容预览
              </h3>
              <div class="h-[calc(100%-2rem)]">
                {selectedDraft.value ? (
                  <FilePreview
                    file={{
                      name: `${selectedDraft.value.title || 'draft'}.md`,
                      contents: selectedDraft.value.text,
                    }}
                  />
                ) : (
                  <div class="flex h-full items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900">
                    选择一个草稿查看内容
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div class="flex flex-shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <NButton onClick={handleCreate}>创建新{props.draftLabel}</NButton>
            <NButton
              type="primary"
              onClick={handleContinue}
              disabled={!selectedDraftId.value}
            >
              继续编辑选中的草稿
            </NButton>
          </div>
        </div>
      </NModal>
    )
  },
})
