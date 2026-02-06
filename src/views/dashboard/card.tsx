import { NBadge, NButton, NCard, NSpace, NThing } from 'naive-ui'
import { defineComponent } from 'vue'
import type { PropType, VNode } from 'vue'

import { Icon } from '@vicons/utils'

import { Statistic } from './statistic'

export interface CardProps {
  label: string
  value: number | string
  icon: VNode | (() => VNode)
  actions?: {
    name: string
    onClick: () => void
    primary?: boolean
    showBadage?: boolean
  }[]
}

export const Card = defineComponent({
  props: {
    label: String,
    value: [Number, String],
    icon: Function as PropType<() => VNode>,
    actions: {
      type: Array as PropType<
        {
          name: string
          onClick: () => void
          primary?: boolean
          showBadge?: { type: Boolean; default: false }
        }[]
      >,
      default: () => [],
    },
  },

  setup(props: CardProps) {
    return () => (
      <NCard>
        <NThing>
          {{
            header: () => <Statistic label={props.label} value={props.value} />,
            'header-extra': () => (
              <Icon class="text-4xl opacity-70">
                {typeof props.icon === 'function' ? props.icon() : props.icon}
              </Icon>
            ),
            action: () => {
              if (!props.actions) return null

              return (
                <NSpace size="medium" align="center">
                  {props.actions.map((action) => {
                    const ActionButton = () =>
                      action.primary ? (
                        <NButton round type="primary" onClick={action.onClick}>
                          {action.name}
                        </NButton>
                      ) : (
                        <NButton text onClick={action.onClick}>
                          {action.name}
                        </NButton>
                      )

                    if (
                      action.showBadage &&
                      props.value &&
                      props.value !== 'N/A'
                    ) {
                      return (
                        <NBadge value={props.value} processing>
                          <ActionButton />
                        </NBadge>
                      )
                    }
                    return <ActionButton />
                  })}
                </NSpace>
              )
            },
          }}
        </NThing>
      </NCard>
    )
  },
})
