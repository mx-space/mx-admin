import { computed, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import type { PropType, VNode } from 'vue'

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
  },
  setup(props, { slots }) {
    const router = useRouter()
    const route = computed(() => router.currentRoute.value)

    const pageTitle = computed(
      () => props.title ?? (route.value.meta?.title as string) ?? '',
    )

    return () => (
      <div class="min-h-full bg-[var(--content-bg)]">
        {!props.hideHeader && (
          <header class="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-[var(--sidebar-border)] bg-[var(--content-bg)] px-5">
            <h1 class="text-[14px] font-medium text-[var(--sidebar-text-active)]">
              {pageTitle.value}
            </h1>
            <div class="flex items-center gap-2">
              {props.actionsElement ?? slots.actions?.()}
            </div>
          </header>
        )}

        {/* Content */}
        <main class="p-5">{slots.default?.()}</main>
      </div>
    )
  },
})

export const useLayout = () => ({
  addFloatButton: () => Symbol(),
  removeFloatButton: () => {},
  setHeaderButtons: () => {},
})
