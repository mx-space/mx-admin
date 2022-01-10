import { useAsyncLoadMonaco } from 'hooks/use-async-monaco'
import { ContentLayout } from 'layouts/content'
import { TwoColGridLayout } from 'layouts/two-col'
import { NButton, NForm, NFormItem, NGi, NSelect } from 'naive-ui'
import { EventTypes } from 'socket/types'
import { RESTManager } from 'utils'

export default defineComponent({
  setup() {
    const event = ref('')
    const payload = ref('')
    const type = ref<'web' | 'admin' | 'all'>('web')
    const editorRef = ref()
    useAsyncLoadMonaco(
      editorRef,
      payload,
      (str) => {
        payload.value = str
      },
      { language: 'json' },
    )
    const handleSend = async () => {
      RESTManager.api.debug.events.post({
        params: {
          type: type.value,
          event: event.value,
        },
        data: JSON.parse(payload.value),
      })
    }
    return () => (
      <ContentLayout>
        <TwoColGridLayout>
          <NGi span="12">
            <NForm>
              <NFormItem label="Type">
                <NSelect
                  tag
                  filterable
                  value={type.value}
                  onUpdateValue={(val) => void (type.value = val)}
                  options={['web', 'all', 'admin'].map((i) => ({
                    value: i,
                    label: i,
                  }))}
                ></NSelect>
              </NFormItem>
              <NFormItem label="Event">
                <NSelect
                  tag
                  filterable
                  value={event.value}
                  onUpdateValue={(val) => void (event.value = val)}
                  options={Object.keys(EventTypes).map((type) => ({
                    value: type,
                    label: type,
                  }))}
                ></NSelect>
              </NFormItem>
            </NForm>

            <div>
              <NButton type="primary" onClick={handleSend}>
                测试
              </NButton>
            </div>
          </NGi>
          <NGi span="24">
            <div class="h-[calc(100vh-20rem)] relative">
              <div ref={editorRef} class="h-full"></div>
            </div>
          </NGi>
        </TwoColGridLayout>
      </ContentLayout>
    )
  },
})
