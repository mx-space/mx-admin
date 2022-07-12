// transform asni to html output
import { default as AnsiUp } from 'ansi_up'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { NCard, NModal } from 'naive-ui'
import { getToken } from 'utils'

const ansi_up = new AnsiUp()
export const ShellOutputNormal = defineComponent({
  setup(_, { expose }) {
    const logViewOpen = ref(false)

    const shellOutput = ref('')

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
            shellOutput.value += 'Done.'
            return
          }
          shellOutput.value += e.data
        }
        event.onerror = (e: any) => {
          event.close()
          if (e?.data) {
            message.error(e.data)
          } else {
            console.error(e)
          }
        }
      },
    })

    watch(
      () => logViewOpen.value,
      (open) => {
        if (!open) {
          shellOutput.value = ''
        }
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
            <div
              class={'font-mono break-all'}
              style={{
                whiteSpace: 'break-spaces',
              }}
              v-html={ansi_up.ansi_to_html(shellOutput.value)}
            ></div>
          </div>
        </NCard>
      </NModal>
    )
  },
})
