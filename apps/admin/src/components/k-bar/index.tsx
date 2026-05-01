import { CornerDownLeft, LogIn, Search } from 'lucide-vue-next'
import { defineComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Action } from '@bytebase/vue-kbar'

import {
  createAction,
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarResults,
  KBarSearch,
  useKBarMatches,
} from '@bytebase/vue-kbar'

import './kbar.css'

export const KBarWrapper = defineComponent({
  setup(_props, { slots }) {
    const router = useRouter()

    const actions = ref([] as Action[])

    onMounted(() => {
      const routes = router.getRoutes()

      actions.value = routes
        .map((route) => {
          if (route?.path.match(':')) {
            return null
          }

          if (
            !route.meta.title ||
            route.children.length > 0 ||
            route.meta.hideKbar
          ) {
            return null
          }
          return createAction({
            id: route.path,
            name: route.meta.title as string,
            subtitle: route.path,
            keywords: route.name as string,
            perform: () =>
              router.push(
                route.name
                  ? {
                      name: route.name as string,
                    }
                  : {
                      path: (route.redirect || route.path) as string,
                    },
              ),
          })
        })
        .filter(Boolean) as Action[]
    })

    return () => (
      <KBarProvider actions={actions.value}>
        <KBarPortal>
          <KBarPositioner class="kbar-positioner">
            <KBarAnimator class="kbar-animator">
              {/* Search input with proper accessibility */}
              <div class="kbar-search-container">
                <Search class="kbar-search-icon" size={20} aria-hidden="true" />
                <KBarSearch class="kbar-search-input" />
                <kbd class="kbar-shortcut" aria-hidden="true">
                  ESC
                </kbd>
              </div>

              <SearchResult />
            </KBarAnimator>
          </KBarPositioner>
        </KBarPortal>

        {slots.default?.()}
      </KBarProvider>
    )
  },
})

const SearchResult = defineComponent({
  setup() {
    const matches = useKBarMatches()

    return () => {
      const results = matches.value.results
      const hasResults = results.length > 0

      if (!hasResults) {
        return (
          <div class="kbar-empty-state" role="status" aria-live="polite">
            <Search
              class="kbar-empty-icon"
              size={40}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span>没有找到匹配的结果</span>
          </div>
        )
      }

      return (
        <KBarResults class="kbar-results" itemHeight={56} items={results}>
          {{
            item({ item, active }) {
              if (typeof item === 'string') {
                return (
                  <div class="kbar-group-label" role="presentation">
                    {item}
                  </div>
                )
              }

              return (
                <div
                  class={['kbar-result-item', active && 'active']}
                  role="option"
                  aria-selected={active}
                  tabindex={-1}
                >
                  <div class="kbar-result-icon" aria-hidden="true">
                    <LogIn size={16} />
                  </div>
                  <div class="kbar-result-content">
                    <span class="kbar-result-name">{item.name}</span>
                    {item.subtitle && (
                      <span class="kbar-result-subtitle">{item.subtitle}</span>
                    )}
                  </div>
                  {active && (
                    <div class="kbar-result-hint" aria-hidden="true">
                      <CornerDownLeft size={14} />
                    </div>
                  )}
                </div>
              )
            },
          }}
        </KBarResults>
      )
    }
  },
})
