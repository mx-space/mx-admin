import { Xterm } from 'components/xterm'
import { useStoreRef } from 'hooks/use-store-ref'
import { NCard, NModal, NSpin } from 'naive-ui'
import { useUIStore } from 'stores/ui'
import type { Terminal } from 'xterm'

import { useEventStreamInstallDependencies } from '../hooks/use-event-stream'

export const InstallDepsXterm = defineComponent({
  setup(_, { expose }) {
    // wait for modal transition done
    const wait = ref(true)
    const logViewOpen = ref(false)
    watch(
      () => logViewOpen.value,
      () => {
        if (logViewOpen.value) {
          wait.value = true
        }

        setTimeout(() => {
          wait.value = false
        }, 1000)
      },
    )

    const xtermData = ref([''])

    expose({
      install(pkg: string | string[], onFinish?: () => any) {
        logViewOpen.value = true
        useEventStreamInstallDependencies(xtermData, pkg, onFinish)
      },
    })

    const { isDark } = useStoreRef(useUIStore)

    let XtermRef: Terminal

    watch(
      () => xtermData.value,
      (dataArr) => {
        if (!XtermRef) {
          return
        }
        if (dataArr.length > 0) {
          dataArr.forEach((data) => XtermRef.write(data))
          xtermData.value.length = 0
        }
      },

      {
        deep: true,
      },
    )

    return () => (
      <NModal
        show={logViewOpen.value}
        onUpdateShow={(s) => {
          logViewOpen.value = s
        }}
        transformOrigin="center"
      >
        <NCard class={'modal-card md'} title="Output">
          <div class="h-full w-full">
            {wait.value ? (
              <div class="w-full flex items-center justify-center h-full">
                <NSpin show strokeWidth={14} />
              </div>
            ) : (
              <Xterm
                colorScheme={isDark ? 'dark' : 'light'}
                onReady={(xterm) => {
                  xtermData.value.forEach((data) => {
                    xterm.write(data)
                  })

                  xtermData.value.length = 0
                  XtermRef = xterm
                }}
              ></Xterm>
            )}
          </div>
        </NCard>
      </NModal>
    )
  },
})
