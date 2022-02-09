import clsx from 'clsx'
import { useInjector } from 'hooks/use-deps-injection'
import { UIStore } from 'stores/ui'
import { PropType } from 'vue'
import { ITerminalOptions, Terminal } from 'xterm'
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
    onMounted(() => {
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
      changeDarkTheme(term, isDark.value)

      props.onReady?.(term)
    })

    onUnmounted(() => {
      props.onDestory?.()
    })
    return () => (
      <div
        id="xterm"
        class={clsx('max-h-[70vh] !bg-transparent', props.class)}
        ref={termRef}
      ></div>
    )
  },
})
