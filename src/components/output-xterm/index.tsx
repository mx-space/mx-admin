// 展示 Shell 输出的 xterm
import { Xterm } from 'components/xterm'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { NCard, NModal, NSpin } from 'naive-ui'
import { getToken } from 'utils'
import type { Terminal } from 'xterm'

export const ShellOutputXterm = defineComponent({
  setup(_, { expose }) {
    // wait for modal transition done
    const wait = ref(true)
    const logViewOpen = ref(false)
    watch(
      () => logViewOpen.value,
      () => {
        if (logViewOpen.value) {
          wait.value = true
        } else {
          wait.value = false
        }

        setTimeout(() => {
          wait.value = false
        }, 1000)
      },
    )

    const xtermData = ref([''])

    expose({
      run(ssePath: string, onFinish?: () => any) {
        logViewOpen.value = true
        const event = new EventSourcePolyfill(ssePath, {
          headers: {
            Authorization: getToken()!,
          },
        })

        event.onmessage = (e) => {
          if (!e) {
            event.close()
            onFinish?.()
            xtermData.value.push('Done.')
            return
          }
          xtermData.value.push(e.data)
        }
        event.onerror = (e: any) => {
          console.log(e.eventPhase)

          event.close()
          if (e?.data) {
            message.error(e.data)
          } else {
            console.error(e)
          }
        }
      },
    })

    const XtermRef = ref<Terminal>()
    watch(
      // @ts-expect-error
      () => [xtermData.value, XtermRef.value],
      ([dataArr, XtermRef]: [string[], Terminal]) => {
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
        <NCard class={'modal-card md min-h-[100px]'} title="Output">
          <div class="h-full w-full">
            {wait.value ? (
              <div class="w-full flex items-center justify-center h-full">
                <NSpin show strokeWidth={14} />
              </div>
            ) : (
              <Xterm
                colorScheme={'auto'}
                onReady={(xterm) => {
                  xtermData.value.forEach((data) => {
                    xterm.write(data)
                  })

                  xtermData.value.length = 0
                  XtermRef.value = xterm
                }}
              ></Xterm>
            )}
          </div>
        </NCard>
      </NModal>
    )
  },
})
