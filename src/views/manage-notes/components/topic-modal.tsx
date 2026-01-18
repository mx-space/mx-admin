/**
 * Topic Edit Modal
 * 专栏编辑模态框 - 创建/编辑专栏
 */
import { Upload as UploadIcon, X } from 'lucide-vue-next'
import { NButton, NInput, NModal, NSpin } from 'naive-ui'
import type { TopicModel } from '~/models/topic'
import type { PropType } from 'vue'

import { UploadWrapper } from '~/components/upload'
import { RESTManager } from '~/utils/rest'

/**
 * Form Field Component
 */
const FormField = defineComponent({
  props: {
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
    error: { type: String, required: false },
  },
  setup(props, { slots }) {
    return () => (
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {props.label}
          {props.required && <span class="ml-0.5 text-red-500">*</span>}
        </label>
        {slots.default?.()}
        {props.error && (
          <p class="mt-1 text-xs text-red-500" role="alert">
            {props.error}
          </p>
        )}
      </div>
    )
  },
})

export const TopicEditModal = defineComponent({
  name: 'TopicEditModal',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
    id: {
      type: String,
      required: false,
    },
    onSubmit: {
      type: Function as PropType<(topic: TopicModel) => void>,
      required: false,
    },
  },
  setup(props) {
    const topic = reactive<Partial<TopicModel>>({})
    const loading = ref(false)
    const submitting = ref(false)
    const errors = reactive<Record<string, string>>({})

    const resetTopicData = () => {
      Object.keys(topic).forEach((key) => {
        delete topic[key as keyof typeof topic]
      })
      Object.keys(errors).forEach((key) => {
        delete errors[key]
      })
    }

    const validateForm = (): boolean => {
      Object.keys(errors).forEach((key) => delete errors[key])

      if (!topic.name?.trim()) {
        errors.name = '请输入专栏名称'
      } else if (topic.name.length > 50) {
        errors.name = '名称不能超过 50 个字符'
      }

      if (!topic.slug?.trim()) {
        errors.slug = '请输入专栏 ID'
      } else if (!/^[\w-]+$/.test(topic.slug)) {
        errors.slug = 'ID 只能包含字母、数字、下划线和连字符'
      }

      if (!topic.introduce?.trim()) {
        errors.introduce = '请输入简介'
      } else if (topic.introduce.length > 100) {
        errors.introduce = '简介不能超过 100 个字符'
      }

      if (topic.description && topic.description.length > 500) {
        errors.description = '描述不能超过 500 个字符'
      }

      return Object.keys(errors).length === 0
    }

    watch(
      () => props.id,
      (id) => {
        if (!id) {
          resetTopicData()
        } else {
          loading.value = true
          RESTManager.api
            .topics(id)
            .get<TopicModel>()
            .then((data) => {
              Object.assign(topic, data)
            })
            .finally(() => {
              loading.value = false
            })
        }
      },
    )

    const handleClose = () => {
      props.onClose()
      nextTick(() => resetTopicData())
    }

    const handleSubmit = async () => {
      if (!validateForm()) return

      submitting.value = true
      try {
        let data: TopicModel
        if (props.id) {
          data = await RESTManager.api.topics(props.id).put({
            data: topic,
          })
          message.success('修改成功')
        } else {
          data = await RESTManager.api.topics.post({
            data: topic,
          })
          message.success('创建成功')
        }
        props.onSubmit?.(data)
        resetTopicData()
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
          if (!show) handleClose()
        }}
        closeOnEsc
        transformOrigin="center"
      >
        <div
          class="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-neutral-900"
          role="dialog"
          aria-modal="true"
          aria-labelledby="topic-modal-title"
          onKeydown={handleKeydown}
        >
          {/* Header */}
          <div class="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <h2
              id="topic-modal-title"
              class="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
            >
              {props.id ? '编辑专栏' : '新建专栏'}
            </h2>
            <button
              type="button"
              class="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              onClick={handleClose}
              aria-label="关闭"
            >
              <X class="size-5" />
            </button>
          </div>

          {/* Body */}
          <div class="px-5 py-4">
            {loading.value ? (
              <div class="flex items-center justify-center py-12">
                <NSpin size="medium" />
              </div>
            ) : (
              <>
                <FormField label="名称" required error={errors.name}>
                  <NInput
                    value={topic.name}
                    onUpdateValue={(v) => (topic.name = v)}
                    placeholder="输入专栏名称"
                    maxlength={50}
                    showCount
                  />
                </FormField>

                <FormField label="ID (Slug)" required error={errors.slug}>
                  <NInput
                    value={topic.slug}
                    onUpdateValue={(v) => (topic.slug = v)}
                    placeholder="输入唯一标识，如 my-topic"
                  />
                  <p class="mt-1 text-xs text-neutral-400">
                    用于 URL，只能包含字母、数字、下划线和连字符
                  </p>
                </FormField>

                <FormField label="简介" required error={errors.introduce}>
                  <NInput
                    value={topic.introduce}
                    onUpdateValue={(v) => (topic.introduce = v)}
                    placeholder="简短介绍这个专栏"
                    maxlength={100}
                    showCount
                  />
                </FormField>

                <FormField label="图标">
                  <div class="flex items-center gap-3">
                    <NInput
                      value={topic.icon}
                      onUpdateValue={(v) => (topic.icon = v)}
                      placeholder="输入图标 URL 或上传"
                      class="flex-1"
                    />
                    <UploadWrapper
                      type="icon"
                      onFinish={(e) => {
                        const res = JSON.parse(
                          (e.event?.target as XMLHttpRequest).responseText,
                        )
                        topic.icon = res.url
                        return e.file
                      }}
                    >
                      <NButton quaternary type="primary" aria-label="上传图标">
                        <UploadIcon class="size-4" />
                      </NButton>
                    </UploadWrapper>
                  </div>
                </FormField>

                <FormField label="详细描述" error={errors.description}>
                  <NInput
                    type="textarea"
                    value={topic.description}
                    onUpdateValue={(v) => (topic.description = v)}
                    placeholder="可选的详细描述"
                    autosize={{ minRows: 2, maxRows: 5 }}
                    maxlength={500}
                    showCount
                  />
                </FormField>
              </>
            )}
          </div>

          {/* Footer */}
          <div class="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <NButton onClick={handleClose}>取消</NButton>
            <NButton
              type="primary"
              loading={submitting.value}
              disabled={loading.value}
              onClick={handleSubmit}
            >
              {props.id ? '保存修改' : '创建专栏'}
            </NButton>
          </div>
        </div>
      </NModal>
    )
  },
})
