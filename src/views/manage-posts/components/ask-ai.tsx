import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NPopover,
  useMessage,
} from 'naive-ui'
import { Configuration, OpenAIApi } from 'openai'

export const AskAiDialog = defineComponent({
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
    const promptDefault = `为下面文章生成一篇摘要，100 字之内：\n\n{{text}}`
    const prompt = ref('')
    const message = useMessage()
    const isLoading = ref(false)
    const handleAskAI = async () => {
      const config = new Configuration({
        apiKey: token.value,
      })
      const ai = new OpenAIApi(config)

      const finalPrompt = (prompt.value || promptDefault).replace(
        '{{text}}',
        props.article,
      )
      const messageIns = message.loading('AI 正在生成摘要...')
      isLoading.value = true
      const response = await ai
        .createChatCompletion({
          messages: [
            {
              content: finalPrompt,
              role: 'user',
            },
          ],
          model: 'gpt-3.5-turbo',
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
      const summary = response.data.choices[0].message?.content as string
      if (!summary) {
        messageIns.destroy()
        message.error('AI 生成摘要失败')
        return
      }

      console.log(summary, 's')

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
            placeholder={promptDefault}
            value={prompt.value}
            onUpdateValue={(val) => void (prompt.value = val)}
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
                    showPasswordToggle
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
