import clsx from 'clsx'
import { useRouter } from 'vue-router'

import type {
  Action} from '@bytebase/vue-kbar';
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

export const KBarWrapper = defineComponent({
  setup(props, { slots }) {
    const router = useRouter()

    const actions = ref([] as Action[])

    onMounted(() => {
      const routes = router.getRoutes()

      actions.value = routes
        .map((route) => {
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
            // keywords: [route.path, route.meta.title, route.name] as string[],
            keywords: route.name as string,
            perform: () =>
              router.push({
                name: route.name as string,
              }),
          })
        })
        .filter(Boolean) as Action[]
    })

    return () => (
      <KBarProvider actions={actions.value}>
        <KBarPortal>
          <KBarPositioner class="backdrop-filter backdrop-blur-sm z-99 bg-gray-300 dark:bg-black dark:bg-opacity-25 bg-opacity-80">
            <KBarAnimator class="bg-white shadow-lg rounded-lg w-[650px] max-w-[80vw] overflow-hidden divide-y">
              <KBarSearch class="px-3 py-4 text-lg w-full box-border outline-none border-none" />

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

    return () => (
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
              return (
                <div
                  class={clsx(
                    'flex flex-col px-3 py-2 h-[50px] box-border select-none cursor-pointer',
                    active && 'bg-gray-200 bg-opacity-50',
                  )}
                >
                  <div>{item.name}</div>
                  {item.subtitle && (
                    <div class="text-gray-400">{item.subtitle}</div>
                  )}
                </div>
              )
            }
          },
        }}
      </KBarResults>
    )
  },
})
