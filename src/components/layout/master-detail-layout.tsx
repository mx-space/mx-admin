import { computed, defineComponent, watchEffect } from 'vue'
import type { PropType } from 'vue'

import { useStoreRef } from '~/hooks/use-store-ref'
import { useLayout } from '~/layouts/content'
import { LayoutStore } from '~/stores/layout'
import { UIStore } from '~/stores/ui'

import { SplitPanel } from './split-panel'

export interface MasterDetailLayoutProps {
  showDetailOnMobile?: boolean
  defaultSize?: number
  min?: number
  max?: number
  listBgClass?: string
  detailBgClass?: string
}

export const MasterDetailLayout = defineComponent({
  name: 'MasterDetailLayout',
  props: {
    showDetailOnMobile: {
      type: Boolean,
      default: false,
    },
    defaultSize: {
      type: [String, Number],
      default: 0.3,
    },
    min: {
      type: [String, Number],
      default: 0.2,
    },
    max: {
      type: [Number, String],
      default: 0.4,
    },
    listBgClass: {
      type: String,
      default: 'bg-white dark:bg-neutral-900',
    },
    detailBgClass: {
      type: String,
      default: 'bg-white dark:bg-neutral-900',
    },
    onMobileBack: {
      type: Function as PropType<() => void>,
    },
  },
  setup(props, { slots }) {
    const ui = useStoreRef(UIStore)
    const layout = useStoreRef(LayoutStore)
    const { setHeaderClass } = useLayout()

    const isMobile = computed(
      () => ui.viewport.value.mobile || ui.viewport.value.pad,
    )

    watchEffect(() => {
      layout.contentPadding.value = false
      layout.contentMinFullHeight.value = true
      setHeaderClass(
        'md:px-4 border-b border-neutral-200 dark:border-neutral-800',
      )
    })

    const DesktopLayout = () => (
      <div class="absolute inset-0 overflow-hidden">
        <SplitPanel
          direction="horizontal"
          defaultSize={props.defaultSize}
          min={props.min}
          max={props.max}
          class="h-full"
        >
          <div
            class={[
              'h-full overflow-hidden border-r border-neutral-200 dark:border-neutral-800',
              props.listBgClass,
            ]}
          >
            {slots.list?.()}
          </div>
          <div
            class={[
              'h-full min-w-0 flex-1 overflow-hidden',
              props.detailBgClass,
            ]}
          >
            {slots.detail?.() ?? slots.empty?.()}
          </div>
        </SplitPanel>
      </div>
    )

    const MobileLayout = () => (
      <div class="absolute inset-0 w-full overflow-x-hidden">
        <div
          class={[
            'absolute inset-0 w-full transition-transform duration-300',
            props.showDetailOnMobile && '-translate-x-full',
          ]}
        >
          <div class={['h-full', props.listBgClass]}>{slots.list?.()}</div>
        </div>

        <div
          class={[
            'absolute inset-0 w-full',
            !props.showDetailOnMobile && 'hidden',
          ]}
        >
          <div class={['h-full', props.listBgClass]}>
            {slots.detail?.() ?? slots.empty?.()}
          </div>
        </div>
      </div>
    )

    return () => (isMobile.value ? <MobileLayout /> : <DesktopLayout />)
  },
})

export const useMasterDetailLayout = () => {
  const ui = useStoreRef(UIStore)
  const isMobile = computed(
    () => ui.viewport.value.mobile || ui.viewport.value.pad,
  )

  return {
    isMobile,
  }
}
