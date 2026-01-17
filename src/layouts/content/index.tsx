import { PanelLeftOpen } from 'lucide-vue-next'
import { NLayoutContent } from 'naive-ui'
import { computed, defineComponent, inject, provide, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import type { InjectionKey, PropType, VNode } from 'vue'

import { useStoreRef } from '~/hooks/use-store-ref'
import { LayoutStore } from '~/stores/layout'
import { UIStore } from '~/stores/ui'

// 用于检测嵌套的 ContentLayout
const ContentLayoutContextKey: InjectionKey<boolean> = Symbol('ContentLayout')

export const ContentLayout = defineComponent({
  name: 'ContentLayout',
  props: {
    title: {
      type: String,
    },
    actionsElement: {
      type: Object as PropType<VNode | null>,
    },
    hideHeader: {
      type: Boolean,
      default: false,
    },
    headerClass: {
      type: String,
    },
    footerButtonElement: {
      type: Object as PropType<VNode | null>,
    },
  },
  setup(props, { slots }) {
    const layout = useStoreRef(LayoutStore)
    const ui = useStoreRef(UIStore)

    // 检测是否已经在 ContentLayout 内部（由 SidebarLayout 提供）
    const isNested = inject(ContentLayoutContextKey, false)

    // 如果是嵌套的 ContentLayout，把 props 同步到 store 并只透传 children
    if (isNested) {
      // 同步 props 到 store（如果 props 有值）
      watchEffect(() => {
        if (props.actionsElement !== undefined) {
          layout.headerActions.value = props.actionsElement
        }
        if (props.title !== undefined) {
          layout.pageTitle.value = props.title
        }
        if (props.hideHeader) {
          layout.hideHeader.value = true
        }
        if (props.headerClass !== undefined) {
          layout.headerClass.value = props.headerClass
        }
        if (props.footerButtonElement !== undefined) {
          layout.footerActions.value = props.footerButtonElement
        }
      })

      return () => <>{slots.default?.()}</>
    }

    // 标记当前在 ContentLayout 内部
    provide(ContentLayoutContextKey, true)

    const router = useRouter()
    const route = computed(() => router.currentRoute.value)

    // 合并 props 和 store 状态（props 优先，保持向后兼容）
    const pageTitle = computed(
      () =>
        props.title ??
        layout.pageTitle.value ??
        (route.value.meta?.title as string) ??
        '',
    )

    const shouldHideHeader = computed(
      () => props.hideHeader || layout.hideHeader.value,
    )

    const headerActions = computed(
      () => props.actionsElement ?? layout.headerActions.value,
    )

    const footerActions = computed(
      () => props.footerButtonElement ?? layout.footerActions.value,
    )

    const headerClassName = computed(
      () => props.headerClass ?? layout.headerClass.value,
    )

    return () => (
      <div class="flex h-full flex-col bg-[var(--content-bg)]">
        {!shouldHideHeader.value && (
          <header
            class={[
              'flex h-16 shrink-0 items-center justify-between px-8',
              headerClassName.value,
            ]}
          >
            <div class="flex items-center gap-3">
              {/* 展开 Sidebar 按钮 */}
              {ui.sidebarCollapse.value && (
                <button
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sidebar-text)] transition-colors hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-active)]"
                  onClick={() => (ui.sidebarCollapse.value = false)}
                  title="展开侧边栏"
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              <h1 class="text-lg font-semibold text-[var(--sidebar-text-active)]">
                {pageTitle.value}
              </h1>
            </div>
            <div class="flex items-center gap-1.5">
              {headerActions.value ?? slots.actions?.()}
            </div>
          </header>
        )}

        {/* Content */}
        <NLayoutContent
          nativeScrollbar={false}
          class="flex-1 !bg-transparent"
          contentClass="px-8 pb-8"
        >
          {slots.default?.()}
        </NLayoutContent>

        {/* Footer Actions & Float Buttons - Vercel-style FAB */}
        {(footerActions.value || layout.floatButtons.value.size > 0) && (
          <footer
            class={[
              'fixed bottom-6 right-6 z-50',
              'flex items-center gap-2',
              // Vercel-style glass container
              'rounded-full px-1.5 py-1.5',
              'bg-white/80 dark:bg-neutral-900/80',
              'backdrop-blur-xl backdrop-saturate-150',
              // Refined border
              'border border-neutral-200/60 dark:border-neutral-700/60',
              'ring-1 ring-black/[0.03] dark:ring-white/[0.03]',
              // Layered shadow for depth
              'shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_4px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06)]',
              'dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_2px_8px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.4)]',
              // Smooth entrance animation
              'animate-in fade-in slide-in-from-bottom-2 duration-300',
            ]}
          >
            {footerActions.value}
            {Array.from(layout.floatButtons.value.values())}
          </footer>
        )}
      </div>
    )
  },
})

// Re-export useLayout composable for convenience
export { useLayout } from '~/hooks/use-layout'
