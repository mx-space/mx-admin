import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NPopover,
  useMessage,
} from 'naive-ui'
import { OpenAI } from 'openai'

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
    const message = useMessage()
    const isLoading = ref(false)
    const handleAskAI = async () => {
      const ai = new OpenAI({
        apiKey: token.value,
        baseURL: base_url.value,
        dangerouslyAllowBrowser: true,
      })

      const finalPrompt = prompt.value.replace('{text}', props.article)
      const messageIns = message.loading('AI 正在生成摘要...')
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
        .catch((err) => {
          messageIns.destroy()
          message.error(`AI 生成摘要失败： ${err.message}`)
        })
        .finally(() => {
          isLoading.value = false
        })

      if (!response) return
      const summary = response.choices[0].message?.content as string
      if (!summary) {
        messageIns.destroy()
        message.error('AI 生成摘要失败')
        return
      }

      messageIns.destroy()
      message.success(`AI 生成的摘要： ${summary}`)
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
          ></NInput>
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
                  ></NInput>
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
                  ></NInput>
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
                  <NInput
                    inputProps={{
                      name: 'openai-model',
                      autocapitalize: 'off',
                    }}
                    showPasswordOn="click"
                    value={model.value}
                    onUpdateValue={(val) => {
                      model.value = val
                    }}
                  ></NInput>
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
