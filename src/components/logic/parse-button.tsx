import { SlackHash } from '@vicons/fa'
import { HeaderActionButton } from 'components/button/rounded-button'
import { NButton, NCard, NInput, NModal, NSpace } from 'naive-ui'
import { defineComponent, PropType, ref } from 'vue'

export const ParseContentButton = defineComponent({
  props: {
    data: {
      type: Object as PropType<{ title: string; text: string }>,
      required: true,
    },
  },
  setup(props) {
    const parseContentDialogShow = ref(false)
    const unparsedValue = ref('')
    const handleParseContent = (value: string) => {
      const str = value.trim()
      const lines = str.split('\n')
      const title = lines.slice(0, 1)[0]

      const res = title.replace('# ', '')

      props.data.title = res
      lines.shift()

      props.data.text = lines.filter(Boolean).join('\n\n')

      parseContentDialogShow.value = false
    }

    return () => (
      <>
        <HeaderActionButton
          icon={<SlackHash />}
          variant="info"
          onClick={() => (parseContentDialogShow.value = true)}
        ></HeaderActionButton>

        <NModal
          show={parseContentDialogShow.value}
          onUpdateShow={s => (parseContentDialogShow.value = s)}
        >
          <NCard title="解析 Markdown" style="max-width: 90vw;width: 60rem">
            <NSpace vertical size={'large'}>
              <NInput
                value={unparsedValue.value}
                onInput={e => (unparsedValue.value = e)}
                type="textarea"
                placeholder="再此输入 Markdown 文本"
                rows={16}
              />
              <NSpace justify="end">
                <NButton
                  round
                  type="primary"
                  onClick={() => handleParseContent(unparsedValue.value)}
                >
                  确定
                </NButton>
                <NButton
                  onClick={_ => {
                    unparsedValue.value = ''
                  }}
                  round
                >
                  重置
                </NButton>
              </NSpace>
            </NSpace>
          </NCard>
        </NModal>
      </>
    )
  },
})
