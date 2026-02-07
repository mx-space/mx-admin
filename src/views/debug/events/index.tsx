import { NButton, NForm, NFormItem, NGi, NSelect } from 'naive-ui'
import { defineComponent, ref, watch } from 'vue'

import { useLocalStorage } from '@vueuse/core'

import { systemApi } from '~/api'
import { useAsyncLoadMonaco } from '~/components/monaco-editor'
import { usePropsValueToRef } from '~/hooks/use-props-value-to-ref'
import { TwoColGridLayout } from '~/layouts/two-col'
import { EventTypes } from '~/socket/types'

const generateFakeData = (type: string) => {
  switch (type) {
    case 'objectId':
      return ((m = Math, d = Date, h = 16, s = (s) => m.floor(s).toString(h)) =>
        s(d.now() / 1000) +
        ' '.repeat(h).replaceAll(/./g, () => s(m.random() * h)))()
    case 'now':
      return new Date().toISOString()
    case 'randomtext':
      return btoa(Math.random().toString()).slice(5, 10)
    case 'randomnumber':
      return Math.floor(Math.random() * 10000)
    default:
      return `{{${type}}}`
  }
}
export default defineComponent({
  setup() {
    const event = useLocalStorage<EventTypes>(
      'debug-event-name',
      EventTypes.POST_CREATE,
    )

    const payload = useLocalStorage<Partial<Record<EventTypes, string>>>(
      'debug-event',
      {},
    )
    const type = useLocalStorage<'web' | 'admin' | 'all'>(
      'debug-event-type',
      'web',
    )

    const value = usePropsValueToRef({
      value: payload.value[event.value] || 'export default {}',
    })
    const editorRef = ref()
    watch(
      () => event.value,
      (eventName) => {
        monaco.editor.setValue(payload.value[eventName] || '')
      },
    )
    const monaco = useAsyncLoadMonaco(
      editorRef,
      value,
      (str) => {
        payload.value = {
          ...payload.value,
          [event.value]: str,
        }
      },
      { language: 'typescript', unSaveConfirm: false },
    )
    const handleSend = async () => {
      const replaceText =
        payload.value[event.value]?.replace(
          /({{(.*?)}})/g,
          // @ts-expect-error dynamic replacement
          (_match, _p1, p2) => {
            return generateFakeData(p2)
          },
        ) ?? ''

      await systemApi.sendDebugEvent({
        type: `${type.value}:${event.value}`,
        payload: new Function(
          `return ${replaceText.replace(/^export default /, '')}`,
        )(),
      })
    }
    return () => (
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
              />
            </NFormItem>
            <NFormItem label="Event">
              <NSelect
                tag
                filterable
                value={event.value}
                onUpdateValue={(val) => void (event.value = val)}
                options={Object.keys(EventTypes).map((key) => ({
                  value: key,
                  label: key,
                }))}
              />
            </NFormItem>
          </NForm>

          <div>
            <NButton type="primary" onClick={handleSend}>
              测试
            </NButton>
          </div>
        </NGi>
        <NGi span="24">
          <div class="relative h-[calc(100vh-20rem)]">
            <div ref={editorRef} class="h-full" />
          </div>
        </NGi>
      </TwoColGridLayout>
    )
  },
})
