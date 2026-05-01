// transform asni to html output
import { AnsiUp } from 'ansi_up'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { NCard, NModal } from 'naive-ui'
import { defineComponent, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

const ansi_up = new AnsiUp()
export const ShellOutputNormal = defineComponent({
  props: {
    onClose: {
      type: Function,
    },
  },
  setup(props, { expose }) {
    const logViewOpen = ref(false)

    const shellOutput = ref('')

    const $output = ref<HTMLDivElement>()

    expose({
      run(ssePath: string, onFinish?: () => any) {
        logViewOpen.value = true
        const event = new EventSourcePolyfill(ssePath, {
          withCredentials: true,
        })

        event.onmessage = (e) => {
          if (!e) {
            event.close()
            onFinish?.()
            shellOutput.value += 'Done.'
            return
          }
          shellOutput.value += e.data

          requestAnimationFrame(() => {
            if (!$output.value) {
              return
            }
            // scroll to el end
            $output.value.scrollTop = $output.value.scrollHeight
          })
        }
        event.onerror = (e: any) => {
          event.close()
          if (e?.data) {
            toast.error(e.data)
          } else {
            shellOutput.value += '\nDone.\n'
            onFinish?.()
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

          if (!s) {
            props.onClose?.()
          }
        }}
        transformOrigin="center"
      >
        <NCard class={'modal-card md min-h-[100px]'} title="Output">
          <div class="h-full w-full">
            <div
              ref={$output}
              class={'h-[75vh] overflow-auto break-all font-mono'}
              style={{
                whiteSpace: 'break-spaces',
              }}
              v-html={ansi_up.ansi_to_html(shellOutput.value)}
            />
          </div>
        </NCard>
      </NModal>
    )
  },
})
