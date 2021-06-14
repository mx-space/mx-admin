import { Icon } from '@vicons/utils'
import { Add12Filled } from '@vicons/fluent'
import { defineComponent, PropType } from '@vue/runtime-core'
import { NButton } from 'naive-ui'
import { RouteLocationRaw, RouterLink } from 'vue-router'

export type ButtonType = PropType<
  'primary' | 'info' | 'success' | 'warning' | 'error'
>
export const RoundedButton = defineComponent({
  props: {
    variant: {
      type: String as ButtonType,
      default: 'primary',
    },
  },
  setup({ variant = 'primary' }, { slots }) {
    return () => {
      return (
        <NButton type={variant} circle>
          {slots}
        </NButton>
      )
    }
  },
})

export const HeaderActionButton = defineComponent({
  props: {
    to: {
      type: [Object, String] as PropType<RouteLocationRaw>,
      required: true,
    },
    variant: {
      type: String as ButtonType,
    },
    icon: {
      type: Object as PropType<JSX.Element>,
      required: true,
    },
  },
  setup(props) {
    const { icon, to, variant = 'primary' } = props

    return () => (
      <RouterLink to={to}>
        <RoundedButton variant={variant} class="shadow">
          <Icon size="20">{icon}</Icon>
        </RoundedButton>
      </RouterLink>
    )
  },
})
