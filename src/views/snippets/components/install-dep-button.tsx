import { HeaderActionButton } from 'components/button/rounded-button'
import { DownloadOutlined } from 'components/icons'
import { NButton, NCard, NForm, NFormItem, NInput, NModal } from 'naive-ui'

import { InstallDepsXterm } from './install-dep-xterm'

export const InstallDependencyButton = defineComponent({
  setup() {
    const modalShow = ref(false)

    const $installDepsComponent = ref<InstanceType<typeof InstallDepsXterm>>()

    const input = ref('')

    const ok = (e?: Event) => {
      e?.preventDefault()
      // @ts-expect-error
      $installDepsComponent.value?.install(input.value)
    }
    return () => {
      return (
        <>
          <HeaderActionButton
            icon={<DownloadOutlined />}
            name="安装依赖"
            color="#FADC4A"
            onClick={() => {
              modalShow.value = true
            }}
          />

          <NModal
            show={modalShow.value}
            onUpdateShow={(show) => {
              modalShow.value = show
            }}
          >
            <NCard class={'modal-card sm'} title="依赖更新">
              <NForm onSubmit={ok}>
                <NFormItem label="Package Name">
                  <NInput
                    value={input.value}
                    onUpdateValue={(value) => {
                      input.value = value
                    }}
                    placeholder="E.g. qs"
                  />
                </NFormItem>
                <div class={'text-right'}>
                  <NButton round type="primary" onClick={ok}>
                    安装
                  </NButton>
                </div>
              </NForm>
            </NCard>
          </NModal>
          <InstallDepsXterm ref={$installDepsComponent} />
        </>
      )
    }
  },
})
