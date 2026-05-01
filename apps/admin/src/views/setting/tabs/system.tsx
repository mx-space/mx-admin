import { cloneDeep, isEmpty } from 'es-toolkit/compat'
import { Mail as MailIcon } from 'lucide-vue-next'
import { NButton, NCard, NInput, NModal } from 'naive-ui'
import {
  computed,
  defineComponent,
  onBeforeMount,
  reactive,
  ref,
  toRaw,
  watch,
} from 'vue'
import { toast } from 'vue-sonner'
import type {
  FormDSL,
  FormGroup,
  FormSection,
} from '~/components/config-form/types'
import type { PropType } from 'vue'

import { aiApi } from '~/api/ai'
import { healthApi } from '~/api/health'
import { optionsApi } from '~/api/options'
import { SectionFields } from '~/components/config-form'
import { SettingsSection } from '~/layouts/settings-layout'
import { deepDiff } from '~/utils'

import { AIConfigSection } from './sections/ai-config'

export const autosizeableProps = {
  autosize: true,
  clearable: true,
  style: 'min-width: 300px; max-width: 100%',
} as const

export const TabSystem = defineComponent({
  props: {
    activeGroup: {
      type: Object as PropType<FormGroup | null>,
      default: null,
    },
    schema: {
      type: Object as PropType<FormDSL | null>,
      default: null,
    },
  },
  emits: ['update:dirty-info'],
  setup(props, { emit, expose }) {
    let originConfigs: any = {}
    const configs = reactive<Record<string, any>>({})

    const sectionDiffs = ref<Record<string, any>>({})
    const isInitializing = ref(true)

    onBeforeMount(async () => {
      await fetchConfig()
    })

    watch(
      () => configs,
      (n) => {
        if (!props.schema) return
        if (isInitializing.value || Object.keys(originConfigs).length === 0)
          return

        const fullDiff = deepDiff(originConfigs, toRaw(n))

        const newSectionDiffs: Record<string, any> = {}
        for (const [key, value] of Object.entries(fullDiff)) {
          if (!isEmpty(value)) {
            newSectionDiffs[key] = value
          }
        }
        sectionDiffs.value = newSectionDiffs
      },
      { deep: true },
    )

    async function saveSection(
      sectionKey: string,
      skipRefetch = false,
      skipMessage = false,
    ) {
      const diff = sectionDiffs.value[sectionKey]
      if (isEmpty(diff)) return

      const sectionConfig = configs[sectionKey]
      if (!sectionConfig) return

      const val = Object.fromEntries(
        Object.entries(diff).map(([k, v]) => {
          if (Array.isArray(v)) {
            return [k, sectionConfig[k]]
          }
          return [k, v]
        }),
      )

      await optionsApi.patch(sectionKey, val)
      if (!skipRefetch) {
        await fetchConfig()
      }
      if (!skipMessage) {
        toast.success('修改成功')
      }
    }

    const fetchConfig = async () => {
      isInitializing.value = true
      const response = await optionsApi.getAll()
      if (!response) {
        isInitializing.value = false
        return
      }

      originConfigs = cloneDeep(response)
      for (const key of Object.keys(configs)) {
        delete configs[key]
      }
      for (const [key, value] of Object.entries(response)) {
        configs[key] = value
      }
      sectionDiffs.value = {}
      isInitializing.value = false
    }

    watch(
      () => props.schema,
      async (newSchema) => {
        if (newSchema) {
          await fetchConfig()
        }
      },
    )

    const isDirty = computed(() => {
      return Object.keys(sectionDiffs.value).length > 0
    })

    const unsavedChangesCount = computed(() => {
      return Object.keys(sectionDiffs.value).length
    })

    watch(
      [isDirty, unsavedChangesCount],
      () => {
        emit('update:dirty-info', {
          isDirty: isDirty.value,
          count: unsavedChangesCount.value,
        })
      },
      { immediate: true },
    )

    async function saveAll() {
      const sectionKeys = Object.keys(sectionDiffs.value)
      if (sectionKeys.length === 0) return

      try {
        await Promise.all(
          sectionKeys.map((key) => saveSection(key, true, true)),
        )

        await fetchConfig()
        toast.success(`已保存 ${sectionKeys.length} 项修改`)
      } catch (error: any) {
        console.error('Failed to save:', error)
        toast.error(error?.message || '保存失败，请重试')
      }
    }

    expose({
      saveAll,
    })

    const isSendingTestEmail = ref(false)

    const handleSendTestEmail = async () => {
      if (isSendingTestEmail.value) return
      isSendingTestEmail.value = true
      try {
        const result = await healthApi.sendTestEmail()
        if (result.message) {
          toast.error(`发送失败: ${result.message}`)
        } else {
          toast.success('测试邮件已发送，请检查收件箱')
        }
      } catch (error: any) {
        toast.error(error?.message || '发送测试邮件失败')
      } finally {
        isSendingTestEmail.value = false
      }
    }

    const showTestAiReviewModal = ref(false)
    const testAiReviewInput = ref('')
    const isTestingAiReview = ref(false)

    const handleTestAiReview = async () => {
      if (!testAiReviewInput.value.trim()) {
        toast.warning('请输入测试内容')
        return
      }
      isTestingAiReview.value = true
      try {
        const result = await aiApi.testCommentReview({
          text: testAiReviewInput.value,
        })
        if (result.isSpam) {
          toast.warning(
            `判定为垃圾评论${result.score !== undefined ? ` (评分: ${result.score})` : ''}${result.reason ? `\n原因: ${result.reason}` : ''}`,
          )
        } else {
          toast.success(
            `判定为正常评论${result.score !== undefined ? ` (评分: ${result.score})` : ''}`,
          )
        }
        showTestAiReviewModal.value = false
        testAiReviewInput.value = ''
      } catch (error: any) {
        toast.error(error?.message || '测试 AI 审核失败')
      } finally {
        isTestingAiReview.value = false
      }
    }

    const handleAction = (actionId: string) => {
      switch (actionId) {
        case 'test-ai-review':
          showTestAiReviewModal.value = true
          break
        default:
          console.warn(`Unknown action: ${actionId}`)
      }
    }

    return () => {
      const { activeGroup } = props

      if (!activeGroup) {
        return <div class="py-12 text-center text-neutral-500">加载中...</div>
      }

      return (
        <div class="space-y-8">
          {activeGroup.sections
            .filter((section: FormSection) => !section.hidden)
            .map((section: FormSection) =>
              section.key === 'ai' ? (
                <AIConfigSection
                  key={section.key}
                  value={configs.ai || {}}
                  onUpdate={(value: any) => {
                    configs.ai = value
                  }}
                />
              ) : (
                <SettingsSection key={section.key} title={section.title}>
                  {{
                    default: () => (
                      <div class="py-2">
                        <SectionFields
                          fields={section.fields}
                          formData={computed(() => configs)}
                          dataKeyPrefix={section.key}
                          onAction={handleAction}
                        />
                      </div>
                    ),
                    actions:
                      section.key === 'mailOptions'
                        ? () => (
                            <NButton
                              size="small"
                              secondary
                              loading={isSendingTestEmail.value}
                              onClick={handleSendTestEmail}
                              renderIcon={() => <MailIcon size={14} />}
                            >
                              发送测试邮件
                            </NButton>
                          )
                        : undefined,
                  }}
                </SettingsSection>
              ),
            )}

          <NModal
            transformOrigin="center"
            show={showTestAiReviewModal.value}
            onUpdateShow={(e) => void (showTestAiReviewModal.value = e)}
          >
            <NCard
              bordered={false}
              title="测试 AI 审核"
              class="w-[500px] max-w-full"
            >
              <div class="space-y-4">
                <p class="text-sm text-neutral-500">
                  输入测试内容，验证 AI 审核功能是否正常工作
                </p>
                <NInput
                  type="textarea"
                  value={testAiReviewInput.value}
                  onUpdateValue={(v: string | null) =>
                    (testAiReviewInput.value = v || '')
                  }
                  placeholder="输入要测试的评论内容..."
                  autosize={{ minRows: 3, maxRows: 6 }}
                />
              </div>
              <div class="mt-6 flex justify-end gap-2">
                <NButton
                  secondary
                  onClick={() => {
                    showTestAiReviewModal.value = false
                    testAiReviewInput.value = ''
                  }}
                >
                  取消
                </NButton>
                <NButton
                  type="primary"
                  loading={isTestingAiReview.value}
                  onClick={handleTestAiReview}
                >
                  测试
                </NButton>
              </div>
            </NCard>
          </NModal>
        </div>
      )
    }
  },
})
