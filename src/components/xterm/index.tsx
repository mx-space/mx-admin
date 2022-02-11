import clsx from 'clsx'
import { useInjector } from 'hooks/use-deps-injection'
import { useMountAndUnmount } from 'hooks/use-react'
import { NSpin } from 'naive-ui'
import { UIStore } from 'stores/ui'
import { PropType } from 'vue'
import type { ITerminalOptions, Terminal } from 'xterm'
import { MaterialDark } from 'xterm-theme'
import 'xterm/css/xterm.css'
const xtermTheme = { ...MaterialDark, background: 'rgba(0,0,0,0)' }
// const xtermTheme = {
//   black: '#000000',
//   red: '#fd5ff1',
//   green: '#87c38a',
//   yellow: '#ffd7b1',
//   blue: '#85befd',
//   magenta: '#b9b6fc',
//   cyan: '#85befd',
//   white: '#e0e0e0',
//   brightBlack: '#000000',
//   brightRed: '#fd5ff1',
//   brightGreen: '#94fa36',
//   brightYellow: '#f5ffa8',
//   brightBlue: '#96cbfe',
//   brightMagenta: '#b9b6fc',
//   brightCyan: '#85befd',
//   brightWhite: '#e0e0e0',
//   foreground: '#c5c8c6',
//   cursor: '#d0d0d0',
//   selection: '#444444',
//   background: 'rgba(0,0,0,0)',
// }

export const Xterm = defineComponent({
  props: {
    darkMode: {
      type: Boolean,
      required: false,
    },
    onResize: {
      type: Function as PropType<
        (size: { cols: number; rows: number }) => void
      >,
      required: false,
    },
    onReady: {
      type: Function as PropType<(term: Terminal) => void>,
      required: false,
    },
    onDestory: {
      type: Function,
      required: false,
    },
    class: {
      type: String,
      required: false,
    },
    terminalOptions: {
      type: Object as PropType<ITerminalOptions>,
      required: false,
    },
  },
  setup(props) {
    let term: Terminal

    const termRef = ref<HTMLElement>()
    const { onlyToggleNaiveUIDark } = useInjector(UIStore)

    const loading = ref(true)
    if (props.darkMode) {
      useMountAndUnmount(() => {
        onlyToggleNaiveUIDark(true)
        return () => {
          onlyToggleNaiveUIDark(false)
        }
      })
    }
    useMountAndUnmount(async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import('xterm'),
        import('xterm-addon-fit'),
      ])

      term = new Terminal({
        rows: 40,
        scrollback: 100000,
        disableStdin: true,
        allowTransparency: true,
        fontFamily: 'Operator Mono SSm Lig Book,Operator Mono,Monaco,monospace',
        convertEol: true,
        cursorStyle: 'underline',
        theme: xtermTheme,
        ...props.terminalOptions,
      })
      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)

      term.open(termRef.value!)
      fitAddon.fit()

      const observer = new ResizeObserver(() => {
        fitAddon.fit()

        if (props.onResize) {
          props.onResize({
            cols: term.cols,
            rows: term.rows,
          })
        }
      })

      observer.observe(termRef.value!)

      loading.value = false
      props.onReady?.(term)

      return () => {
        observer.disconnect()
      }
    })

    onUnmounted(() => {
      props.onDestory?.()
    })
    return () => (
      <NSpin show={loading.value}>
        <div
          id="xterm"
          class={clsx('max-h-[70vh] !bg-transparent', props.class)}
          ref={termRef}
        ></div>
      </NSpin>
    )
  },
})
