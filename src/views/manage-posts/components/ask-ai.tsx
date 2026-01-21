import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NPopover,
  NSelect,
  NSpace,
} from 'naive-ui'
import { OpenAI } from 'openai'
import { defineComponent, ref } from 'vue'
import { toast } from 'vue-sonner'
import type { PropType } from 'vue'

import { useStorage } from '@vueuse/core'

export const AISummaryDialog = defineComponent({
  props: {
    article: {
      type: String,
      required: true,
    },
    onSuccess: {
      type: Function as PropType<(summary: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const token = useStorage('openai-token', '')
    const base_url = useStorage('openai-base-url', 'https://api.openai.com/v1/')

    const prompt = useStorage(
      'openai-prompt',
      `Summarize this in Chinese language:
"{text}"
CONCISE SUMMARY:`,
    )
    const model = useStorage('openai-model', 'gpt-3.5-turbo')
    const default_models = [
      {
        label: 'GPT 3.5 Turbo',
        value: 'gpt-3.5-turbo',
      },
      {
        label: 'GPT 3.5 Turbo 16k',
        value: 'gpt-3.5-turbo-16k',
      },
      {
        label: 'GPT 4 Turbo',
        value: 'gpt-4-turbo-preview',
      },
    ]
    const isOtherModel = ref(false)
    isOtherModel.value = !default_models.some((m) => m.value === model.value)
    const isLoading = ref(false)
    const handleAskAI = async () => {
      const ai = new OpenAI({
        apiKey: token.value,
        baseURL: base_url.value,
        dangerouslyAllowBrowser: true,
      })

      const finalPrompt = prompt.value.replace('{text}', props.article)
      const messageIns = toast.loading('AI 正在生成摘要...')
      isLoading.value = true
      const response = await ai.chat.completions
        .create({
          messages: [
            {
              content: finalPrompt,
              role: 'user',
            },
          ],
          model: model.value,
          max_tokens: 300,
          stream: false,
        })
        .catch((error) => {
          toast.dismiss(messageIns)
          toast.error(`AI 生成摘要失败： ${error.message}`)
        })
        .finally(() => {
          isLoading.value = false
        })

      if (!response) return
      const summary = response.choices[0].message?.content as string
      if (!summary) {
        toast.dismiss(messageIns)
        toast.error('AI 生成摘要失败')
        return
      }

      toast.dismiss(messageIns)
      toast.success(`AI 生成的摘要： ${summary}`)
      props.onSuccess(summary)
    }

    return () => (
      <NForm>
        <NFormItem label="Prompt">
          <NInput
            autosize={{
              maxRows: 8,
              minRows: 4,
            }}
            type="textarea"
            value={prompt.value}
            onUpdateValue={(val) => {
              prompt.value = val
            }}
          />
        </NFormItem>

        <NFormItem label="OpenAI Token">
          <NPopover>
            {{
              trigger() {
                return (
                  <NInput
                    inputProps={{
                      name: 'openai-token',
                      autocapitalize: 'off',
                      autocomplete: 'new-password',
                    }}
                    showPasswordOn="click"
                    type="password"
                    value={token.value}
                    onUpdateValue={(val) => {
                      token.value = val
                    }}
                  />
                )
              },
              default() {
                return 'OpenAI Token 用于调用 OpenAI API，Token 只会保存在本地'
              },
            }}
          </NPopover>
        </NFormItem>

        <NFormItem label="OpenAI Base URL">
          <NPopover>
            {{
              trigger() {
                return (
                  <NInput
                    inputProps={{
                      name: 'openai-base_url',
                      autocapitalize: 'off',
                    }}
                    showPasswordOn="click"
                    value={base_url.value}
                    onUpdateValue={(val) => {
                      base_url.value = val
                    }}
                  />
                )
              },
              default() {
                return 'OpenAI Base URL 用于调用 OpenAI API，默认为 https://api.openai.com/v1/'
              },
            }}
          </NPopover>
        </NFormItem>

        <NFormItem label="OpenAI Model">
          <NPopover>
            {{
              trigger() {
                return (
                  <NSpace vertical class={'w-full'}>
                    <NSelect
                      filterable
                      options={[
                        ...default_models,
                        {
                          label: '其他',
                          value: '',
                        },
                      ]}
                      value={!isOtherModel.value ? model.value : ''}
                      defaultValue={'gpt-3.5-turbo'}
                      onUpdateValue={(val) => {
                        isOtherModel.value = val === ''
                        model.value = val
                      }}
                    />
                    <NInput
                      value={model.value}
                      disabled={!isOtherModel.value}
                      class={!isOtherModel.value ? 'hidden' : ''}
                      placeholder="自定义 Model 名称"
                      onUpdateValue={(val) => {
                        model.value = val
                      }}
                    />
                  </NSpace>
                )
              },
              default() {
                return 'OpenAI Model 用于调用 OpenAI API，默认为 gpt-3.5-turbo'
              },
            }}
          </NPopover>
        </NFormItem>

        <div class={'flex flex-grow justify-center'}>
          <NButton
            loading={isLoading.value}
            type="primary"
            round
            onClick={handleAskAI}
            attrType="submit"
          >
            生成！
          </NButton>
        </div>
      </NForm>
    )
  },
})
