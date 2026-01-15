import { NButton } from 'naive-ui'
import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'
import type { ButtonHTMLAttributes, PropType, VNode } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

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
    type: Function as any as PropType<ButtonHTMLAttributes['onClick']>,
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
      type: Object as PropType<VNode>,
      required: true,
    },
  },
  setup(props) {
    const Button = () => (
      <button
        onClick={props.onClick}
        disabled={props.disabled}
        title={props.name}
        class={[
          'inline-flex h-8 w-8 items-center justify-center rounded-md',
          'text-[var(--sidebar-text)] transition-colors',
          'hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-active)]',
          'disabled:pointer-events-none disabled:opacity-40',
          '[&>svg]:h-[18px] [&>svg]:w-[18px]',
        ]}
      >
        {props.icon}
      </button>
    )

    return () =>
      props.to ? (
        <RouterLink to={props.to} class="inline-flex">
          <Button />
        </RouterLink>
      ) : (
        <Button />
      )
  },
})
