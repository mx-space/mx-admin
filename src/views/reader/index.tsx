import { Crown, Mail, Users } from 'lucide-vue-next'
import { NAvatar, NEmpty, NInfiniteScroll, NSkeleton, NTooltip } from 'naive-ui'
import { computed, defineComponent, ref } from 'vue'

import { readersApi } from '~/api'
import type { ReaderModel } from '~/api/readers'
import type { PaginateResult } from '~/models/base'

const GithubIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24">
    <path
      d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
      fill="currentColor"
    />
  </svg>
)

type ReaderWithKey = ReaderModel & { _key: string }

const PAGE_SIZE = 20

const ReaderView = defineComponent({
  setup() {
    const readers = ref<ReaderWithKey[]>([])
    const loading = ref(true)
    const hasNextPage = ref(true)
    const currentPage = ref(0)
    const total = ref(0)
    const keySet = new Set<string>()

    const ownerCount = computed(
      () => readers.value.filter((r) => r.isOwner).length,
    )

    const fetchReaders = async (page: number) => {
      const result = await readersApi.getList({ page, size: PAGE_SIZE })

      const newReaders = result.data
        .map((r, idx) => {
          const key = `${r.id}-${r.provider || idx}`
          return { ...r, _key: key }
        })
        .filter((r) => {
          if (keySet.has(r._key)) return false
          keySet.add(r._key)
          return true
        })

      readers.value.push(...newReaders)
      currentPage.value = result.pagination.currentPage
      hasNextPage.value = result.pagination.hasNextPage
      total.value = result.pagination.total
      loading.value = false
    }

    const handleLoad = async () => {
      if (!hasNextPage.value) return
      await fetchReaders(currentPage.value + 1)
    }

    // Initial load
    fetchReaders(1)

    return () => (
      <div class="flex h-full flex-col">
        {/* Header */}
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Users class="size-5" />
            </div>
            <div>
              <h1 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                读者列表
              </h1>
              <p class="text-sm text-neutral-500">
                {loading.value ? (
                  <NSkeleton text style={{ width: '80px' }} />
                ) : (
                  <span class="tabular-nums">
                    共 {total.value} 位读者
                    {ownerCount.value > 0 && (
                      <span class="ml-2 text-amber-500">
                        · {ownerCount.value} 位站长
                      </span>
                    )}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div class="min-h-0 flex-1 overflow-auto">
          {loading.value ? (
            <LoadingSkeleton />
          ) : readers.value.length === 0 ? (
            <NEmpty description="暂无读者" class="py-20" />
          ) : (
            <NInfiniteScroll distance={200} onLoad={handleLoad}>
              {readers.value.map((reader, index) => (
                <ReaderItem
                  key={reader._key}
                  reader={reader}
                  isLast={
                    index === readers.value.length - 1 && !hasNextPage.value
                  }
                />
              ))}
            </NInfiniteScroll>
          )}
        </div>
      </div>
    )
  },
})

export default ReaderView

const LoadingSkeleton = defineComponent({
  setup() {
    return () => (
      <div class="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            class="rounded-naive flex items-center gap-4 bg-neutral-50 p-4 dark:bg-neutral-800/50"
          >
            <NSkeleton circle style={{ width: '48px', height: '48px' }} />
            <div class="flex-1 space-y-2">
              <NSkeleton text style={{ width: '30%' }} />
              <NSkeleton text style={{ width: '50%' }} />
            </div>
          </div>
        ))}
      </div>
    )
  },
})

const ReaderItem = defineComponent({
  props: {
    reader: {
      type: Object as () => ReaderWithKey,
      required: true,
    },
    isLast: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    return () => {
      const { reader, isLast } = props

      return (
        <div
          class={[
            'group flex items-center gap-4 px-4 py-3 transition-colors',
            'hover:bg-neutral-100 dark:hover:bg-neutral-800/80',
            !isLast && 'border-b border-neutral-100 dark:border-neutral-800',
          ]}
        >
          {/* Avatar */}
          <div class="relative shrink-0">
            <NAvatar
              round
              size={48}
              src={reader.image}
              fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(reader.name)}&background=random`}
            />
            {/* Provider Badge */}
            {reader.provider && (
              <div class="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">
                <ProviderIcon provider={reader.provider} size={12} />
              </div>
            )}
          </div>

          {/* Info */}
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate font-medium text-neutral-900 dark:text-neutral-100">
                {reader.name}
              </span>
              {reader.isOwner && (
                <NTooltip>
                  {{
                    trigger: () => (
                      <span class="flex size-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                        <Crown class="size-3" />
                      </span>
                    ),
                    default: () => '站长',
                  }}
                </NTooltip>
              )}
            </div>
            <div class="mt-0.5 flex items-center gap-3 text-sm text-neutral-500">
              {reader.handle && (
                <span class="flex items-center gap-1 truncate">
                  <span class="text-neutral-400">@</span>
                  <span class="truncate">{reader.handle}</span>
                </span>
              )}
              {reader.email && (
                <NTooltip>
                  {{
                    trigger: () => (
                      <span class="flex shrink-0 items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                        <Mail class="size-3" />
                        <span class="hidden sm:inline">{reader.email}</span>
                      </span>
                    ),
                    default: () => reader.email,
                  }}
                </NTooltip>
              )}
            </div>
          </div>

          {/* Provider Name */}
          {reader.provider && (
            <div class="hidden shrink-0 sm:block">
              <span class="rounded-full bg-neutral-100 px-2.5 py-1 text-xs capitalize text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                {reader.provider}
              </span>
            </div>
          )}
        </div>
      )
    }
  },
})

const ProviderIcon = defineComponent({
  props: {
    provider: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 16,
    },
  },
  setup(props) {
    return () => {
      const style = { width: `${props.size}px`, height: `${props.size}px` }

      switch (props.provider) {
        case 'github':
          return (
            <span
              class="flex items-center justify-center text-neutral-900 dark:text-neutral-100"
              style={style}
            >
              <GithubIcon />
            </span>
          )
        case 'google':
          return (
            <img
              style={style}
              src="https://authjs.dev/img/providers/google.svg"
              alt="Google"
              width={props.size}
              height={props.size}
            />
          )
        default:
          return (
            <img
              style={style}
              src={`https://authjs.dev/img/providers/${props.provider}.svg`}
              alt={props.provider}
              width={props.size}
              height={props.size}
            />
          )
      }
    }
  },
})
