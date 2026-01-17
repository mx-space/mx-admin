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
        aria-label={props.name}
        class={[
          'inline-flex size-10 items-center justify-center rounded-xl',
          'text-neutral-600 dark:text-neutral-400',
          'bg-neutral-100/80 dark:bg-neutral-800/50',
          'transition-colors duration-150',
          'hover:bg-neutral-200 hover:text-neutral-900',
          'dark:hover:bg-neutral-700 dark:hover:text-neutral-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
          'dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-900',
          'disabled:pointer-events-none disabled:opacity-40',
          'touch-action-manipulation',
          '[&>svg]:size-5',
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
