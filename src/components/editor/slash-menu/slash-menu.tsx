import {
  defineComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  Teleport,
  toRef,
  Transition,
  watch,
} from 'vue'
import type { EditorView } from '@codemirror/view'
import type { PropType } from 'vue'

import { useSlashMenu } from './use-slash-menu'

import './slash-menu.css'

export const SlashMenu = defineComponent({
  name: 'SlashMenu',
  props: {
    editorView: {
      type: Object as PropType<EditorView | undefined>,
      required: true,
    },
  },
  setup(props) {
    const menuRef = ref<HTMLDivElement | null>(null)
    const itemRefs = ref<Map<string, HTMLButtonElement>>(new Map())
    const {
      isOpen,
      position,
      query,
      groupedItems,
      flatItems,
      activeIndex,
      executeItem,
      closeMenu,
      syncFromEditor,
    } = useSlashMenu(toRef(props, 'editorView'))

    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (!isOpen.value) return
      const target = event.target
      if (!(target instanceof Node)) return
      if (menuRef.value?.contains(target)) return
      closeMenu()
    }

    const scrollActiveItemIntoView = () => {
      const items = flatItems.value
      if (items.length === 0) return
      const activeItem = items[activeIndex.value]
      if (!activeItem) return
      const el = itemRefs.value.get(activeItem.id)
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }

    watch(activeIndex, () => {
      nextTick(scrollActiveItemIntoView)
    })

    onMounted(() => {
      document.addEventListener('pointerdown', handleDocumentPointerDown)
    })

    onUnmounted(() => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown)
    })

    return () => (
      <Teleport to="body">
        <Transition
          enterActiveClass="slash-menu-enter-active"
          leaveActiveClass="slash-menu-leave-active"
          enterFromClass="slash-menu-enter-from"
          leaveToClass="slash-menu-leave-to"
          onAfterEnter={syncFromEditor}
        >
          {isOpen.value && position.value && (
            <div
              ref={menuRef}
              class={[
                'slash-menu',
                'fixed z-[70]',
                'max-h-[380px] min-w-[260px] max-w-[320px]',
                'overflow-hidden rounded-xl',
                'bg-white/95 dark:bg-neutral-900/95',
                'backdrop-blur-xl backdrop-saturate-150',
                'border border-neutral-200/60 dark:border-neutral-700/60',
                'shadow-xl shadow-neutral-900/10 dark:shadow-neutral-950/50',
                'flex flex-col',
              ]}
              style={{
                left: `${position.value.x}px`,
                top: `${position.value.y}px`,
              }}
              onMousedown={(event) => event.preventDefault()}
            >
              {/* Header */}
              <div
                class={[
                  'flex-shrink-0',
                  'flex items-center justify-between gap-2',
                  'px-3 py-2.5',
                  'border-b border-neutral-100 dark:border-neutral-800',
                ]}
              >
                <span class="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  命令
                </span>
                {query.value && (
                  <span class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    /{query.value}
                  </span>
                )}
              </div>

              {/* Content */}
              <div class="flex-1 overflow-y-auto overscroll-contain p-1.5">
                {flatItems.value.length === 0 && (
                  <div class="px-3 py-6 text-center">
                    <span class="text-sm text-neutral-400 dark:text-neutral-500">
                      未找到匹配命令
                    </span>
                  </div>
                )}

                {groupedItems.value.map((group, groupIndex) => (
                  <div
                    class={
                      groupIndex > 0
                        ? 'mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800'
                        : ''
                    }
                    key={group.id}
                  >
                    <div class="px-2 py-1.5 text-xs font-medium text-neutral-400 dark:text-neutral-500">
                      {group.label}
                    </div>
                    <div class="flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const index = flatItems.value.findIndex(
                          (entry) => entry.id === item.id,
                        )
                        const isActive = index === activeIndex.value
                        const IconComponent = item.icon

                        return (
                          <button
                            key={item.id}
                            ref={(el) => {
                              if (el) {
                                itemRefs.value.set(
                                  item.id,
                                  el as HTMLButtonElement,
                                )
                              }
                            }}
                            type="button"
                            class={[
                              'slash-menu-item',
                              'relative flex w-full items-center gap-3',
                              'rounded-lg px-2 py-2',
                              'text-left transition-colors duration-100',
                              isActive
                                ? 'bg-neutral-100 dark:bg-neutral-800'
                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                            ]}
                            onClick={() => executeItem(item)}
                            onMouseenter={() => {
                              if (index >= 0) {
                                activeIndex.value = index
                              }
                            }}
                          >
                            {/* Active indicator */}
                            {isActive && (
                              <div class="bg-primary absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" />
                            )}

                            {/* Icon */}
                            <div
                              class={[
                                'flex flex-shrink-0 items-center justify-center',
                                'size-8 rounded-lg',
                                isActive
                                  ? 'bg-white shadow-sm dark:bg-neutral-700'
                                  : 'bg-neutral-100 dark:bg-neutral-800',
                              ]}
                            >
                              {IconComponent && (
                                // @ts-ignore
                                <IconComponent
                                  size={16}
                                  strokeWidth={2}
                                  class={[
                                    isActive
                                      ? 'text-primary'
                                      : 'text-neutral-500 dark:text-neutral-400',
                                  ]}
                                />
                              )}
                            </div>

                            {/* Text content */}
                            <div class="min-w-0 flex-1">
                              <div
                                class={[
                                  'truncate text-sm font-medium',
                                  isActive
                                    ? 'text-neutral-900 dark:text-neutral-100'
                                    : 'text-neutral-700 dark:text-neutral-300',
                                ]}
                              >
                                {item.label}
                              </div>
                              {item.description && (
                                <div class="truncate text-xs text-neutral-400 dark:text-neutral-500">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer hint */}
              <div
                class={[
                  'flex-shrink-0',
                  'flex items-center justify-center gap-3',
                  'px-3 py-2',
                  'border-t border-neutral-100 dark:border-neutral-800',
                  'text-xs text-neutral-400 dark:text-neutral-500',
                ]}
              >
                <span class="flex items-center gap-1">
                  <kbd class="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">
                    ↑↓
                  </kbd>
                  <span>导航</span>
                </span>
                <span class="flex items-center gap-1">
                  <kbd class="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">
                    ↵
                  </kbd>
                  <span>选择</span>
                </span>
                <span class="flex items-center gap-1">
                  <kbd class="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">
                    Esc
                  </kbd>
                  <span>关闭</span>
                </span>
              </div>
            </div>
          )}
        </Transition>
      </Teleport>
    )
  },
})
