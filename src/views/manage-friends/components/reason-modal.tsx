import { LinkState, LinkStateNameMap } from 'models/link'
import { NButton, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import type { PropType } from 'vue'

export const LinkAuditModal = defineComponent({
  props: {
    onCallback: {
      type: Function as PropType<(state: LinkState, reason: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const reason = ref('')
    const linkState = ref(LinkState.Pass)
    const stateOptions: SelectMixedOption[] = Object.entries(LinkStateNameMap)
      .filter(([key]) => key !== 'Audit')
      .map(([key, label]) => {
        return {
          value: LinkState[key],
          key,
          label,
        }
      })

    const handleValidateButtonClick = () => {
      props.onCallback(linkState.value, reason.value)
    }

    return () => (
      <NForm class={'mt-6'}>
        <NFormItem label="状态">
          <NSelect
            value={linkState.value}
            onUpdateValue={(val) => (linkState.value = val)}
            options={stateOptions}
          />
        </NFormItem>
        <NFormItem label="原因">
          <NInput
            type="textarea"
            value={reason.value}
            onUpdateValue={(val) => (reason.value = val)}
            placeholder="请输入原因"
            maxlength={200}
            autosize={{
              maxRows: 4,
              minRows: 2,
            }}
          ></NInput>
        </NFormItem>

        <div class={'flex justify-end'}>
          <NButton round type="primary" onClick={handleValidateButtonClick}>
            发送
          </NButton>
        </div>
      </NForm>
    )
  },
})
