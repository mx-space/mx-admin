/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/* eslint-disable @typescript-eslint/no-empty-function */
import clsx from 'clsx'
import { NLayoutContent } from 'naive-ui'
import {
  PropType,
  VNode,
  computed,
  defineComponent,
  inject,
  onUnmounted,
  provide,
  ref,
} from 'vue'
import { useRouter } from 'vue-router'

import styles from './index.module.css'

const ProvideKey = Symbol('inject')

interface Injectable {
  addFloatButton: (vnode: VNode) => symbol
  removeFloatButton: (name: symbol) => void
  setHeaderButtons: (vnode: VNode | null) => void
}
export const useLayout = () =>
  inject<Injectable>(ProvideKey, {
    addFloatButton(el: VNode) {
      return Symbol()
    },
    removeFloatButton(name: symbol) {},
    setHeaderButtons(el: VNode | null) {},
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
    provide<Injectable>(ProvideKey, {
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

      setHeaderButtons(el: VNode | null) {
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

    const pageTitle = computed(
      () =>
        props.title ??
        route.value.value.matched.reduce(
          (t, cur) =>
            t +
            (cur.meta.title
              ? // t 不为空, 补一个 分隔符
                t.length > 0
                ? ' · ' + cur.meta.title
                : cur.meta.title
              : ''),
          '',
        ),
    )

    const SettingHeaderEl = ref<(() => VNode) | null>()
    // 抽出动态组件, 防止整个子代组件全部重渲染
    const Header = defineComponent({
      setup() {
        return () => (
          <div class={clsx(styles['header-actions'], 'space-x-4')}>
            {SettingHeaderEl.value ? (
              <SettingHeaderEl.value />
            ) : props.actionsElement ? (
              <A$ael />
            ) : (
              slots.actions?.()
            )}
          </div>
        )
      },
    })
    const Footer = defineComponent({
      setup() {
        return () => (
          <footer class={styles['buttons']}>
            {footerExtraButtonEl.value
              ? footerExtraButtonEl.value.map((E: any) => (
                  <E key={E.displayName} />
                ))
              : null}
            {props.footerButtonElement ? <A$fel /> : slots.buttons?.()}
          </footer>
        )
      },
    })

    return () => (
      <>
        <NLayoutContent class={styles['sticky-header']} embedded>
          <header class={styles['header']}>
            <h1 class={styles['title']}>{pageTitle.value}</h1>

            <Header />
          </header>
        </NLayoutContent>
        <main class={styles['main']}>{slots.default?.()}</main>
        <Footer />
      </>
    )
  },
})
