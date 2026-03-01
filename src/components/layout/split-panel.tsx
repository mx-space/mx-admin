/**
 * SplitPanel - NSplit 封装，内置 resize-trigger，支持直接传 children 或数组
 *
 * @example
 * <SplitPanel defaultSize={0.3} min={0.2} max={0.4}>
 *   <PanelA />
 *   <PanelB />
 * </SplitPanel>
 */
import { NSplit } from 'naive-ui'
import { defineComponent } from 'vue'
import type { PropType, VNode } from 'vue'

import { SplitResizeTrigger } from './split-resize-trigger'

type PanelContent = (() => VNode) | VNode

const renderPanel = (p: PanelContent) =>
  typeof p === 'function' ? p() : (p ?? null)

export const SplitPanel = defineComponent({
  name: 'SplitPanel',
  props: {
    direction: {
      type: String as PropType<'horizontal' | 'vertical'>,
      default: 'horizontal',
    },
    defaultSize: {
      type: [String, Number],
      default: 0.5,
    },
    size: [String, Number],
    min: {
      type: [String, Number],
      default: 0,
    },
    max: {
      type: [String, Number],
      default: 1,
    },
    disabled: Boolean,

    resizeTriggerClass: {
      type: String,
      default: '',
    },
    class: [String, Object],
    onUpdateSize: Function as PropType<(size: number | string) => void>,
    onDragStart: Function as PropType<(e: Event) => void>,
    onDragMove: Function as PropType<(e: Event) => void>,
    onDragEnd: Function as PropType<(e: Event) => void>,
  },
  setup(props, { slots }) {
    return () => {
      const defaultSlot = slots.default?.()
      const panels: PanelContent[] = Array.isArray(defaultSlot)
        ? defaultSlot
        : defaultSlot
          ? [defaultSlot]
          : []

      return (
        <NSplit
          direction={props.direction}
          defaultSize={props.defaultSize}
          size={props.size}
          min={props.min}
          max={props.max}
          disabled={props.disabled}
          class={props.class}
          onUpdateSize={props.onUpdateSize}
          onDragStart={props.onDragStart}
          onDragMove={props.onDragMove}
          onDragEnd={props.onDragEnd}
        >
          {{
            1: () => renderPanel(panels[0]),
            2: () => renderPanel(panels[1]),
            'resize-trigger': () => (
              <SplitResizeTrigger triggerClass={props.resizeTriggerClass} />
            ),
          }}
        </NSplit>
      )
    }
  },
})
