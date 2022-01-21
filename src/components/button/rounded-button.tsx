import { Icon } from '@vicons/utils'
import { NButton, NPopover } from 'naive-ui'
import { defineComponent, PropType } from 'vue'
import { RouteLocationRaw, RouterLink } from 'vue-router'

export type ButtonType = PropType<
  'primary' | 'info' | 'success' | 'warning' | 'error'
>

export const baseButtonProps = {
  variant: {
    type: String as ButtonType,
    default: 'primary',
  },
  color: {
    type: String,
  },
  onClick: {
    type: Function as any as PropType<
      JSX.IntrinsicElements['button']['onClick'] | undefined
    >,
  },
  disabled: {
    type: Boolean,
  },
}
export const RoundedButton = defineComponent({
  props: baseButtonProps,
  setup(props, { slots }) {
    return () => {
      return (
        <NButton
          type={props.variant}
          color={props.color}
          circle
          onClick={props.onClick}
          disabled={props.disabled}
        >
          {slots}
        </NButton>
      )
    }
  },
})

export const HeaderActionButton = defineComponent({
  props: {
    ...baseButtonProps,
    to: {
      type: [Object, String] as PropType<RouteLocationRaw>,
    },
    name: {
      type: String,
    },
    icon: {
      type: Object as PropType<JSX.Element>,
      required: true,
    },
  },
  setup(props) {
    const Inner = () => (
      <RoundedButton
        variant={props.variant}
        class="shadow"
        onClick={props.onClick}
        disabled={props.disabled}
        color={props.color}
      >
        <Icon size="16">{props.icon}</Icon>
      </RoundedButton>
    )
    const WrapInfo = () =>
      props.name ? (
        <NPopover trigger="hover" placement="bottom">
          {{
            trigger() {
              return <Inner />
            },
            default() {
              return props.name
            },
          }}
        </NPopover>
      ) : (
        <Inner />
      )
    return () =>
      props.to ? (
        <RouterLink to={props.to}>
          <WrapInfo />
        </RouterLink>
      ) : (
        <WrapInfo />
      )
  },
})
