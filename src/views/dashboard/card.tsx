import { NButton, NCard, NSpace, NThing } from 'naive-ui'
import Badge from 'naive-ui/lib/badge/src/Badge'
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
    icon: Function as PropType<() => JSX.Element>,
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
  // @ts-expect-error
  setup(props: CardProps) {
    return () => (
      <>
        <NCard>
          <NThing>
            {{
              header() {
                return (
                  <Statistic
                    label={props.label}
                    value={props.value}
                  ></Statistic>
                )
              },
              ['header-extra']: function () {
                return (
                  <Icon class="text-4xl opacity-70">
                    {typeof props.icon == 'function'
                      ? props.icon()
                      : props.icon}
                  </Icon>
                )
              },

              action() {
                if (!props.actions) {
                  return null
                }
                return (
                  <NSpace size="medium" align="center">
                    {props.actions.map((i) => {
                      const Inner = () =>
                        i.primary ? (
                          <NButton round type="primary" onClick={i.onClick}>
                            {i.name}
                          </NButton>
                        ) : (
                          <NButton text onClick={i.onClick}>
                            {i.name}
                          </NButton>
                        )
                      return i.showBadage &&
                        props.value &&
                        props.value !== 'N/A' ? (
                        <Badge value={props.value} processing>
                          <Inner />
                        </Badge>
                      ) : (
                        <Inner />
                      )
                    })}
                  </NSpace>
                )
              },
            }}
          </NThing>
        </NCard>
      </>
    )
  },
})
