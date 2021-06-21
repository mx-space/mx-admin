import { Icon } from '@vicons/utils'
import { defineComponent, PropType } from 'vue'
import { NButton, NPopover } from 'naive-ui'
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
    onClick: {
      type: Function as any as PropType<
        JSX.IntrinsicElements['button']['onClick'] | undefined
      >,
    },
    disabled: {
      type: Boolean,
    },
  },
  setup(props, { slots }) {
    return () => {
      return (
        <NButton
          type={props.variant}
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
    to: {
      type: [Object, String] as PropType<RouteLocationRaw>,
    },
    variant: {
      type: String as ButtonType,
    },
    icon: {
      type: Object as PropType<JSX.Element>,
      required: true,
    },
    onClick: {
      type: Function as any as PropType<
        JSX.IntrinsicElements['button']['onClick']
      >,
    },
    disabled: {
      type: Boolean,
    },
    name: {
      type: String,
    },
  },
  setup(props) {
    const Inner = () => (
      <RoundedButton
        variant={props.variant}
        class="shadow"
        onClick={props.onClick}
        disabled={props.disabled}
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
