import { NTooltip } from 'naive-ui'
import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'
import type { ButtonHTMLAttributes, PropType, VNode } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

export type ButtonType = PropType<
  'primary' | 'info' | 'success' | 'warning' | 'error'
>

type HeaderButtonVariant =
  | 'default'
  | 'primary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'

export const HeaderActionButton = defineComponent({
  props: {
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
    rounded: {
      type: Boolean,
      default: false,
    },
    variant: {
      type: String as PropType<HeaderButtonVariant>,
      default: 'default',
    },
    onClick: {
      type: Function as any as PropType<ButtonHTMLAttributes['onClick']>,
    },
    disabled: {
      type: Boolean,
    },
  },
  setup(props) {
    const variantClasses: Record<HeaderButtonVariant, string[]> = {
      default: [
        'text-neutral-600 dark:text-neutral-400',
        'bg-neutral-100/80 dark:bg-neutral-800/50',
        'hover:bg-neutral-200 hover:text-neutral-900',
        'dark:hover:bg-neutral-700 dark:hover:text-neutral-100',
      ],
      primary: [
        'text-white dark:text-neutral-900',
        'bg-neutral-900 dark:bg-white',
        'hover:bg-neutral-800 dark:hover:bg-neutral-100',
      ],
      info: [
        'text-blue-600 dark:text-blue-400',
        'bg-blue-50 dark:bg-blue-950/50',
        'hover:bg-blue-100 dark:hover:bg-blue-900/50',
      ],
      success: [
        'text-green-600 dark:text-green-400',
        'bg-green-50 dark:bg-green-950/50',
        'hover:bg-green-100 dark:hover:bg-green-900/50',
      ],
      warning: [
        'text-amber-600 dark:text-amber-400',
        'bg-amber-50 dark:bg-amber-950/50',
        'hover:bg-amber-100 dark:hover:bg-amber-900/50',
      ],
      error: [
        'text-red-600 dark:text-red-400',
        'bg-red-50 dark:bg-red-950/50',
        'hover:bg-red-100 dark:hover:bg-red-900/50',
      ],
    }

    const Button = () => (
      <button
        onClick={props.onClick}
        disabled={props.disabled}
        title={props.name}
        aria-label={props.name}
        class={[
          'inline-flex size-10 items-center justify-center',
          props.rounded ? 'rounded-xl' : 'rounded-naive',
          ...variantClasses[props.variant],
          'transition-colors duration-150',
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

    const ButtonWithTooltip = () => {
      const btn = props.to ? (
        <RouterLink to={props.to} class="inline-flex">
          <Button />
        </RouterLink>
      ) : (
        <Button />
      )

      if (props.name) {
        return (
          <NTooltip placement="bottom">
            {{
              trigger: () => btn,
              default: () => props.name,
            }}
          </NTooltip>
        )
      }

      return btn
    }

    return () => <ButtonWithTooltip />
  },
})
