import { useRouter } from 'vue-router'
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarResults,
  KBarSearch,
  createAction,
  useKBarMatches,
} from '@bytebase/vue-kbar'
import type { Action } from '@bytebase/vue-kbar'

export const KBarWrapper = defineComponent({
  setup(props, { slots }) {
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
          <KBarPositioner class="z-99 bg-gray-300 bg-opacity-80 backdrop-blur-sm backdrop-filter dark:bg-black dark:bg-opacity-25">
            <KBarAnimator class="w-[650px] max-w-[80vw] divide-y overflow-hidden rounded-lg bg-white shadow-lg">
              <KBarSearch class="box-border w-full border-none px-3 py-4 text-lg outline-none" />

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

    return () => [
      <KBarResults
        class="max-h-96"
        itemHeight={50}
        items={matches.value.results}
      >
        {{
          item({ item, index, active }) {
            if (typeof item === 'string') {
              return <div class="p-2">{item}</div>
            } else {
              return [
                <div
                  class={[
                    'box-border flex h-[50px] cursor-pointer select-none flex-col px-3 py-2',
                    active && 'bg-gray-200 bg-opacity-50',
                  ]}
                >
                  <div>{item.name}</div>
                  {item.subtitle && (
                    <div class="text-gray-400">{item.subtitle}</div>
                  )}
                </div>,
              ]
            }
          },
        }}
      </KBarResults>,
    ]
  },
})
