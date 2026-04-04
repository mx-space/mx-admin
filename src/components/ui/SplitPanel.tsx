import { defineComponent, onBeforeUnmount, ref } from 'vue'

export const SplitPanel = defineComponent({
  name: 'SplitPanel',
  props: {
    defaultRatio: { type: Number, default: 0.6 },
    minLeft: { type: Number, default: 300 },
    minRight: { type: Number, default: 280 },
    collapsed: { type: Boolean, default: false },
    collapseThreshold: { type: Number, default: 100 },
    storageKey: { type: String, default: undefined },
  },
  emits: ['update:collapsed'],
  setup(props, { emit, slots }) {
    const containerRef = ref<HTMLDivElement>()
    const ratio = ref(props.defaultRatio)
    const dragging = ref(false)

    if (props.storageKey) {
      const saved = localStorage.getItem(`split-panel:${props.storageKey}`)
      if (saved) {
        const parsed = Number.parseFloat(saved)
        if (!Number.isNaN(parsed) && parsed > 0 && parsed < 1)
          ratio.value = parsed
      }
    }

    let rafId = 0

    function onPointerDown(e: PointerEvent) {
      e.preventDefault()
      dragging.value = true
      const el = e.currentTarget as HTMLElement
      el.setPointerCapture(e.pointerId)
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging.value || !containerRef.value) return
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const rect = containerRef.value!.getBoundingClientRect()
        const x = e.clientX - rect.left
        const totalW = rect.width

        const rightW = totalW - x
        if (rightW < props.collapseThreshold) {
          emit('update:collapsed', true)
          return
        }

        if (props.collapsed) {
          emit('update:collapsed', false)
        }

        const clamped = Math.max(
          props.minLeft / totalW,
          Math.min(1 - props.minRight / totalW, x / totalW),
        )
        ratio.value = clamped
      })
    }

    function onPointerUp() {
      dragging.value = false
      if (props.storageKey) {
        localStorage.setItem(
          `split-panel:${props.storageKey}`,
          String(ratio.value),
        )
      }
    }

    function onDividerClick() {
      if (props.collapsed) {
        emit('update:collapsed', false)
      }
    }

    onBeforeUnmount(() => cancelAnimationFrame(rafId))

    return () => {
      const isCollapsed = props.collapsed
      const leftW = isCollapsed ? '100%' : `${ratio.value * 100}%`
      const rightW = isCollapsed ? '0%' : `${(1 - ratio.value) * 100}%`

      return (
        <div
          ref={containerRef}
          class="flex h-full w-full overflow-hidden"
          style={dragging.value ? { cursor: 'col-resize' } : undefined}
        >
          <div
            class="h-full min-w-0 overflow-hidden"
            style={{ width: leftW, flexShrink: 0 }}
          >
            {slots.left?.()}
          </div>
          <div
            class="flex flex-shrink-0 cursor-col-resize select-none items-center justify-center"
            style={{ width: '8px', zIndex: 1 }}
            onPointerdown={onPointerDown}
            onPointermove={onPointerMove}
            onPointerup={onPointerUp}
            onClick={onDividerClick}
          >
            <div
              class="rounded-sm transition-colors"
              style={{
                width: '3px',
                height: '32px',
                background: dragging.value
                  ? '#a3a3a3'
                  : 'var(--n-border-color, #e5e5e5)',
              }}
            />
          </div>
          {!isCollapsed && (
            <div
              class="h-full min-w-0 overflow-hidden"
              style={{ width: rightW }}
            >
              {slots.right?.()}
            </div>
          )}
        </div>
      )
    }
  },
})
