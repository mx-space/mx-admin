import clsx from 'clsx'
import { useInjector } from 'hooks/use-deps-injection'
import { useMountAndUnmount } from 'hooks/use-react'
import { NSpin } from 'naive-ui'
import { UIStore } from 'stores/ui'
import { PropType } from 'vue'
import type { ITerminalOptions, Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { Material, MaterialDark } from 'xterm-theme'
import 'xterm/css/xterm.css'

function changeDarkTheme(term: Terminal, dark: boolean) {
  if (dark) {
    term.options.theme = { ...MaterialDark, background: 'rgba(0,0,0,0)' }
  } else {
    term.options.theme = { ...Material, background: 'rgba(0,0,0,0)' }
  }
}

export const Xterm = defineComponent({
  props: {
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
    const { isDark } = useInjector(UIStore)
    watch(
      () => isDark.value,
      (isDark) => {
        if (term) {
          changeDarkTheme(term, isDark)
        }
      },
    )

    const loading = ref(true)
    useMountAndUnmount(async () => {
      const { Terminal } = await import('xterm')

      term = new Terminal({
        rows: 40,
        scrollback: 100000,
        disableStdin: true,
        allowTransparency: true,
        convertEol: true,
        cursorStyle: 'underline',

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

      changeDarkTheme(term, isDark.value)
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
