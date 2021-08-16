/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-empty-function */
import {
  computed,
  defineComponent,
  inject,
  onUnmounted,
  PropType,
  provide,
  ref,
  VNode,
} from 'vue'
import clsx from 'clsx'
import { useRouter } from 'vue-router'
import styles from './index.module.css'
import { Icon } from '@vicons/utils'
import Sun from '@vicons/fa/es/Sun'
import Moon from '@vicons/fa/es/Moon'
import { useInjector } from 'hooks/use-deps-injection'
import { UIStore } from 'stores/ui'

const ProvideKey = Symbol('inject')

export const useLayout = () =>
  inject(ProvideKey, {
    addFloatButton(el: VNode) {},
    removeFloatButton(name: symbol) {},
    setHeaderButton(el: VNode | null) {},
  })
export const ContentLayout = defineComponent({
  props: {
    actionsElement: {
      type: Object as PropType<JSX.Element | null>,
      required: false,
    },
    footerButtonElement: {
      type: Object as PropType<JSX.Element | null>,
      required: false,
    },
    title: {
      type: String,
    },
  },
  setup(props, ctx) {
    const { slots } = ctx
    const router = useRouter()
    const route = computed(() => router.currentRoute)
    const A$ael = () => props.actionsElement ?? null
    const A$fel = () => props.footerButtonElement ?? null
    const footerExtraButtonEl = ref<
      null | ((() => VNode) & { displayName$: symbol })[]
    >(null)
    provide(ProvideKey, {
      addFloatButton(el: VNode | (() => VNode)) {
        footerExtraButtonEl.value ??= []
        const E: any = typeof el === 'function' ? el : () => el
        E.displayName$ = E.name ? Symbol(E.name) : Symbol('fab')
        footerExtraButtonEl.value.push(E)

        return E.displayName$
      },
      removeFloatButton(name: symbol) {
        if (!footerExtraButtonEl.value) {
          return
        }
        const index = footerExtraButtonEl.value.findIndex(
          (E) => E.displayName$ === name,
        )
        if (index && index !== -1) {
          footerExtraButtonEl.value.splice(index, 1)
        }
      },

      setHeaderButton(el: VNode | null) {
        if (!el) {
          SettingHeaderEl.value = null
          return
        }
        SettingHeaderEl.value = () => el
      },
    })

    onUnmounted(() => {
      footerExtraButtonEl.value = null
    })

    const { isDark, toggleDark } = useInjector(UIStore)
    const SettingHeaderEl = ref<(() => VNode) | null>()
    return () => (
      <>
        <header class={styles['header']}>
          <div class={styles['header-blur']}></div>
          <h1 class={styles['title']}>
            {props.title ?? route.value.value.meta.title}
          </h1>

          <div class={clsx(styles['header-actions'], 'space-x-4')}>
            {SettingHeaderEl.value ? (
              <SettingHeaderEl.value />
            ) : props.actionsElement ? (
              <A$ael />
            ) : (
              slots.actions?.()
            )}
          </div>
        </header>
        <main class={styles['main']}>{slots.default?.()}</main>
        <footer class={styles['buttons']}>
          {footerExtraButtonEl.value
            ? footerExtraButtonEl.value.map((E: any) => (
                <E key={E.displayName} />
              ))
            : null}
          {props.footerButtonElement ? <A$fel /> : slots.buttons?.()}
          <button onClick={() => void toggleDark()}>
            <Icon>{isDark.value ? <Sun /> : <Moon />}</Icon>
          </button>
        </footer>
      </>
    )
  },
})
