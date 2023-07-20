import { useStoreRef } from 'hooks/use-store-ref'
import { NSpin } from 'naive-ui'
import { UIStore } from 'stores/ui'
import { Material, MaterialDark } from 'xterm-theme'
import type { PropType } from 'vue'
import type { ITerminalOptions, Terminal } from 'xterm'

import { useMountAndUnmount } from '~/hooks/use-lifecycle'

import 'xterm/css/xterm.css'

const xtermThemeDark = { ...MaterialDark, background: 'rgba(0,0,0,0)' }
const xtermThemeLight = { ...Material, background: 'rgba(0,0,0,0)' }

export const Xterm = defineComponent({
  props: {
    colorScheme: {
      type: String as PropType<'light' | 'dark' | 'auto'>,
      default: 'dark',
    },
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
    const { onlyToggleNaiveUIDark, isDark } = useStoreRef(UIStore)

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

      const themes = {
        dark: xtermThemeDark,
        light: xtermThemeLight,
        auto: isDark.value ? xtermThemeDark : xtermThemeLight,
      }

      term = new Terminal({
        rows: 40,
        scrollback: 100000,
        disableStdin: true,
        allowTransparency: true,
        fontFamily: 'Operator Mono SSm Lig Book,Operator Mono,Monaco,monospace',
        convertEol: true,
        cursorStyle: 'underline',
        theme: themes[props.colorScheme],
        ...props.terminalOptions,
      })
      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)

      term.open(termRef.value!)
      fitAddon.fit()

      const observer = new ResizeObserver(() => {
        try {
          fitAddon.fit()
        } catch {}

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

    onBeforeUnmount(() => {
      props.onDestory?.()
    })
    return () => (
      <NSpin show={loading.value}>
        <div
          id="xterm"
          class={['max-h-[70vh] !bg-transparent', props.class]}
          ref={termRef}
        ></div>
      </NSpin>
    )
  },
})
