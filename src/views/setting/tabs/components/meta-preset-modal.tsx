/**
 * Meta Preset Edit Modal
 * Meta 预设字段编辑模态框 - 创建/编辑预设
 */
import {
  Plus as PlusIcon,
  Trash2 as Trash2Icon,
  X as XIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NCheckbox,
  NInput,
  NModal,
  NSelect,
  NSpin,
  NSwitch,
} from 'naive-ui'
import { defineComponent, nextTick, reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import type {
  CreateMetaPresetDto,
  MetaFieldType,
  MetaPresetField,
  MetaPresetScope,
} from '~/models/meta-preset'
import type { PropType } from 'vue'

import { useMutation } from '@tanstack/vue-query'

import { metaPresetsApi } from '~/api/meta-presets'

/**
 * 字段类型选项
 */
const fieldTypeOptions: { label: string; value: MetaFieldType }[] = [
  { label: '文本', value: 'text' },
  { label: '多行文本', value: 'textarea' },
  { label: '数字', value: 'number' },
  { label: 'URL', value: 'url' },
  { label: '单选', value: 'select' },
  { label: '多选', value: 'multi-select' },
  { label: '复选框', value: 'checkbox' },
  { label: '标签', value: 'tags' },
  { label: '开关', value: 'boolean' },
  { label: '对象', value: 'object' },
]

/**
 * 作用域选项
 */
const scopeOptions: { label: string; value: MetaPresetScope }[] = [
  { label: '博文', value: 'post' },
  { label: '笔记', value: 'note' },
  { label: '通用', value: 'both' },
]

/**
 * 需要选项配置的字段类型
 */
const typesWithOptions: MetaFieldType[] = ['select', 'multi-select', 'checkbox']

/**
 * Form Field Component
 */
const FormField = defineComponent({
  props: {
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
    error: { type: String, required: false },
    hint: { type: String, required: false },
  },
  setup(props, { slots }) {
    return () => (
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {props.label}
          {props.required && <span class="ml-0.5 text-red-500">*</span>}
        </label>
        {slots.default?.()}
        {props.hint && !props.error && (
          <p class="mt-1 text-xs text-neutral-400">{props.hint}</p>
        )}
        {props.error && (
          <p class="mt-1 text-xs text-red-500" role="alert">
            {props.error}
          </p>
        )}
      </div>
    )
  },
})

export const MetaPresetModal = defineComponent({
  name: 'MetaPresetModal',
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
      type: Function as PropType<(preset: MetaPresetField) => void>,
      required: false,
    },
  },
  setup(props) {
    const preset = reactive<Partial<CreateMetaPresetDto>>({
      type: 'text',
      scope: 'both',
      enabled: true,
    })
    const loading = ref(false)
    const submitting = ref(false)
    const errors = reactive<Record<string, string>>({})

    const resetPresetData = () => {
      Object.keys(preset).forEach((key) => {
        delete preset[key as keyof typeof preset]
      })
      preset.type = 'text'
      preset.scope = 'both'
      preset.enabled = true
      Object.keys(errors).forEach((key) => {
        delete errors[key]
      })
    }

    const validateForm = (): boolean => {
      Object.keys(errors).forEach((key) => delete errors[key])

      if (!preset.key?.trim()) {
        errors.key = '请输入字段 Key'
      } else if (!/^[\w-]+$/.test(preset.key)) {
        errors.key = 'Key 只能包含字母、数字、下划线和连字符'
      }

      if (!preset.label?.trim()) {
        errors.label = '请输入显示名称'
      }

      if (!preset.type) {
        errors.type = '请选择字段类型'
      }

      // 验证选项类型需要有选项
      if (typesWithOptions.includes(preset.type as MetaFieldType)) {
        if (!preset.options || preset.options.length === 0) {
          errors.options = '请至少添加一个选项'
        }
      }

      // 验证 object 类型需要有子字段
      if (preset.type === 'object') {
        if (!preset.children || preset.children.length === 0) {
          errors.children = '请至少添加一个子字段'
        }
      }

      return Object.keys(errors).length === 0
    }

    watch(
      () => props.id,
      (id) => {
        if (!id) {
          resetPresetData()
        } else {
          loading.value = true
          metaPresetsApi
            .getById(id)
            .then((data) => {
              Object.assign(preset, data)
            })
            .finally(() => {
              loading.value = false
            })
        }
      },
    )

    const handleClose = () => {
      props.onClose()
      nextTick(() => resetPresetData())
    }

    // 创建预设
    const createMutation = useMutation({
      mutationFn: (data: CreateMetaPresetDto) => metaPresetsApi.create(data),
      onSuccess: (data) => {
        toast.success('创建成功')
        props.onSubmit?.(data)
        resetPresetData()
      },
    })

    // 更新预设
    const updateMutation = useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: string
        data: Partial<CreateMetaPresetDto>
      }) => metaPresetsApi.update(id, data),
      onSuccess: (data) => {
        toast.success('修改成功')
        props.onSubmit?.(data)
        resetPresetData()
      },
    })

    const handleSubmit = () => {
      if (!validateForm()) return

      submitting.value = true
      if (props.id) {
        updateMutation.mutate(
          { id: props.id, data: preset },
          { onSettled: () => (submitting.value = false) },
        )
      } else {
        createMutation.mutate(preset as CreateMetaPresetDto, {
          onSettled: () => (submitting.value = false),
        })
      }
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSubmit()
      }
    }

    // 添加选项
    const addOption = () => {
      if (!preset.options) {
        preset.options = []
      }
      preset.options.push({ value: '', label: '' })
    }

    const removeOption = (index: number) => {
      preset.options?.splice(index, 1)
    }

    // 添加子字段
    const addChild = () => {
      if (!preset.children) {
        preset.children = []
      }
      preset.children.push({
        key: '',
        label: '',
        type: 'text',
      })
    }

    const removeChild = (index: number) => {
      preset.children?.splice(index, 1)
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
          class="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl dark:bg-neutral-900"
          role="dialog"
          aria-modal="true"
          aria-labelledby="meta-preset-modal-title"
          onKeydown={handleKeydown}
        >
          {/* Header */}
          <div class="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <h2
              id="meta-preset-modal-title"
              class="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
            >
              {props.id ? '编辑预设字段' : '新建预设字段'}
            </h2>
            <button
              type="button"
              class="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              onClick={handleClose}
              aria-label="关闭"
            >
              <XIcon class="size-5" />
            </button>
          </div>

          {/* Body */}
          <div class="max-h-[calc(90vh-140px)] overflow-y-auto px-5 py-4">
            {loading.value ? (
              <div class="flex items-center justify-center py-12">
                <NSpin size="medium" />
              </div>
            ) : (
              <>
                {/* 基础信息 */}
                <div class="grid grid-cols-2 gap-4">
                  <FormField label="字段 Key" required error={errors.key}>
                    <NInput
                      value={preset.key}
                      onUpdateValue={(v) => (preset.key = v)}
                      placeholder="如: music, movie"
                    />
                  </FormField>

                  <FormField label="显示名称" required error={errors.label}>
                    <NInput
                      value={preset.label}
                      onUpdateValue={(v) => (preset.label = v)}
                      placeholder="如: 音乐, 电影"
                    />
                  </FormField>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <FormField label="字段类型" required error={errors.type}>
                    <NSelect
                      value={preset.type}
                      onUpdateValue={(v) => (preset.type = v)}
                      options={fieldTypeOptions}
                    />
                  </FormField>

                  <FormField label="作用域">
                    <NSelect
                      value={preset.scope}
                      onUpdateValue={(v) => (preset.scope = v)}
                      options={scopeOptions}
                    />
                  </FormField>
                </div>

                <FormField label="描述" hint="可选的字段描述">
                  <NInput
                    value={preset.description}
                    onUpdateValue={(v) => (preset.description = v)}
                    placeholder="字段用途说明"
                  />
                </FormField>

                <FormField label="占位文本" hint="输入框占位提示文本">
                  <NInput
                    value={preset.placeholder}
                    onUpdateValue={(v) => (preset.placeholder = v)}
                    placeholder="请输入..."
                  />
                </FormField>

                {/* 选项配置 - 仅 select/multi-select/checkbox 类型 */}
                {typesWithOptions.includes(preset.type as MetaFieldType) && (
                  <FormField label="选项配置" required error={errors.options}>
                    <div class="space-y-2">
                      {preset.options?.map((option, index) => (
                        <div key={index} class="flex items-center gap-2">
                          <NInput
                            value={option.value}
                            onUpdateValue={(v) => (option.value = v)}
                            placeholder="值"
                            class="flex-1"
                          />
                          <NInput
                            value={option.label}
                            onUpdateValue={(v) => (option.label = v)}
                            placeholder="显示文本"
                            class="flex-1"
                          />
                          <NButton
                            quaternary
                            type="error"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2Icon class="size-4" />
                          </NButton>
                        </div>
                      ))}
                      <NButton quaternary type="primary" onClick={addOption}>
                        <PlusIcon class="mr-1 size-4" />
                        添加选项
                      </NButton>
                    </div>

                    {/* 允许自定义选项 */}
                    {(preset.type === 'select' ||
                      preset.type === 'multi-select') && (
                      <div class="mt-2 flex items-center gap-2">
                        <NCheckbox
                          checked={preset.allowCustomOption}
                          onUpdateChecked={(v) =>
                            (preset.allowCustomOption = v)
                          }
                        >
                          允许自定义选项
                        </NCheckbox>
                      </div>
                    )}
                  </FormField>
                )}

                {/* 子字段配置 - 仅 object 类型 */}
                {preset.type === 'object' && (
                  <FormField
                    label="子字段配置"
                    required
                    error={errors.children}
                  >
                    <div class="space-y-3">
                      {preset.children?.map((child, index) => (
                        <div
                          key={index}
                          class="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
                        >
                          <div class="mb-2 flex items-center justify-between">
                            <span class="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                              子字段 {index + 1}
                            </span>
                            <NButton
                              quaternary
                              type="error"
                              size="tiny"
                              onClick={() => removeChild(index)}
                            >
                              <Trash2Icon class="size-3.5" />
                            </NButton>
                          </div>
                          <div class="grid grid-cols-3 gap-2">
                            <NInput
                              value={child.key}
                              onUpdateValue={(v) => (child.key = v)}
                              placeholder="Key"
                              size="small"
                            />
                            <NInput
                              value={child.label}
                              onUpdateValue={(v) => (child.label = v)}
                              placeholder="显示名称"
                              size="small"
                            />
                            <NSelect
                              value={child.type}
                              onUpdateValue={(v) => (child.type = v)}
                              options={fieldTypeOptions.filter(
                                (o) => o.value !== 'object',
                              )}
                              size="small"
                            />
                          </div>
                        </div>
                      ))}
                      <NButton quaternary type="primary" onClick={addChild}>
                        <PlusIcon class="mr-1 size-4" />
                        添加子字段
                      </NButton>
                    </div>
                  </FormField>
                )}

                {/* 启用状态 */}
                <div class="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
                  <div>
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      启用此预设
                    </span>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                      禁用后不会在写作页面显示
                    </p>
                  </div>
                  <NSwitch
                    value={preset.enabled}
                    onUpdateValue={(v) => (preset.enabled = v)}
                  />
                </div>
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
              {props.id ? '保存修改' : '创建预设'}
            </NButton>
          </div>
        </div>
      </NModal>
    )
  },
})
