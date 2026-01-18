import { useQuery } from '@tanstack/vue-query'
import { add } from 'date-fns'
import {
  BookOpen as BookOpenIcon,
  Calendar as CalendarIcon,
  Crown as CrownIcon,
  ExternalLink as ExternalLinkIcon,
  Eye as EyeIcon,
  TrendingUp as TrendingUpIcon,
} from 'lucide-vue-next'
import { NButton, NDatePicker, NSkeleton, NSpace } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import type {
  NoteModel,
  PageModel,
  PostModel,
  RecentlyModel,
} from '@mx-space/api-client'

import { activityApi } from '~/api/activity'
import { queryKeys } from '~/hooks/queries/keys'
import { apiClient } from '~/utils/request'

import styles from '../index.module.css'

interface RankingItem {
  ref: Partial<PostModel | NoteModel | PageModel | RecentlyModel>
  refId: string
  count: number
}

export const ReadingRank = defineComponent({
  setup() {
    const dateRange = ref([+add(new Date(), { days: -7 }), Date.now()] as [
      number,
      number,
    ])

    const { data, isPending, refetch } = useQuery({
      queryKey: queryKeys.activity.readingRank(),
      queryFn: () => activityApi.getReadingRank(),
    })

    watch(dateRange, () => {
      refetch()
    })

    const loading = computed(() => isPending.value)
    const maxCount = computed(() =>
      Math.max(...(data.value?.map((item) => item.count) || [1]), 1),
    )

    return () => (
      <>
        {/* Filter Section */}
        <div class={styles.filterSection}>
          <span class={styles.filterLabel}>
            <CalendarIcon class="mr-1.5 inline size-4" />
            时间范围
          </span>
          <NDatePicker
            class="w-[380px]"
            type="datetimerange"
            clearable
            value={dateRange.value}
            onUpdateValue={(range) => {
              dateRange.value = range as [number, number]
            }}
          >
            {{
              footer: () => (
                <NSpace class="py-2">
                  <NButton
                    round
                    type="default"
                    size="small"
                    onClick={() => {
                      const now = new Date()
                      dateRange.value = [+add(now, { days: -1 }), +now]
                    }}
                  >
                    最近 24 小时
                  </NButton>
                  <NButton
                    round
                    type="default"
                    size="small"
                    onClick={() => {
                      const now = new Date()
                      dateRange.value = [+add(now, { days: -7 }), +now]
                    }}
                  >
                    最近 7 天
                  </NButton>
                  <NButton
                    round
                    type="default"
                    size="small"
                    onClick={() => {
                      const now = new Date()
                      dateRange.value = [+add(now, { days: -30 }), +now]
                    }}
                  >
                    最近 30 天
                  </NButton>
                </NSpace>
              ),
            }}
          </NDatePicker>
        </div>

        {/* Ranking List */}
        {loading.value ? (
          <div class={styles.rankingList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} class={styles.skeleton}>
                <div class="flex items-center gap-4">
                  <NSkeleton circle style={{ width: '32px', height: '32px' }} />
                  <div class="flex-1">
                    <NSkeleton
                      text
                      style={{ width: '200px', marginBottom: '8px' }}
                    />
                    <NSkeleton text style={{ width: '100%', height: '6px' }} />
                  </div>
                  <NSkeleton text style={{ width: '40px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : !data.value?.length ? (
          <div class={styles.empty}>
            <div class={styles.emptyIcon}>
              <TrendingUpIcon />
            </div>
            <h3 class={styles.emptyTitle}>暂无阅读数据</h3>
            <p class={styles.emptyDescription}>选定时间范围内没有阅读记录</p>
          </div>
        ) : (
          <div class={styles.rankingList} role="list" aria-label="阅读排名">
            {data.value.map((item, index) => {
              // Transform ReadingRankItem to RankingItem
              const rankingItem: RankingItem = {
                ref: { id: item.id, title: item.title },
                refId: item.refId || item.id,
                count: item.count,
              }
              return (
                <RankingListItem
                  key={item.refId || item.id}
                  item={rankingItem}
                  position={index + 1}
                  maxCount={maxCount.value}
                />
              )
            })}
          </div>
        )}
      </>
    )
  },
})

const RankingListItem = defineComponent({
  props: {
    item: {
      type: Object as () => RankingItem,
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
    maxCount: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const isTop3 = computed(() => props.position <= 3)
    const percentage = computed(() => (props.item.count / props.maxCount) * 100)

    const handleOpenArticle = () => {
      apiClient
        .get<{ data: string }>(`/helper/url-builder/${props.item.ref.id}`)
        .then(({ data: url }) => {
          window.open(url)
        })
    }

    return () => (
      <div class={styles.rankingItem} role="listitem">
        {/* Position Badge */}
        <div
          class={[
            styles.rankingPosition,
            isTop3.value
              ? styles.rankingPositionTop
              : styles.rankingPositionNormal,
          ]}
        >
          {isTop3.value && props.position === 1 ? (
            <CrownIcon class="size-4" />
          ) : (
            props.position
          )}
        </div>

        {/* Content */}
        <div class={styles.rankingContent}>
          <button
            type="button"
            class={styles.rankingTitle}
            onClick={handleOpenArticle}
            aria-label={`查看文章: ${(props.item.ref as any).title}`}
          >
            <span class="mr-1.5 inline-flex items-center gap-1">
              <BookOpenIcon class="size-3.5 text-neutral-400" />
            </span>
            {(props.item.ref as any).title}
            <ExternalLinkIcon class="ml-1 inline size-3 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>

          {/* Progress Bar */}
          <div class={styles.rankingBar}>
            <div
              class={styles.rankingBarFill}
              style={{ width: `${percentage.value}%` }}
            />
          </div>
        </div>

        {/* Count */}
        <div class={styles.rankingCount}>
          <EyeIcon class="mr-1 inline size-4 text-neutral-400" />
          {props.item.count.toLocaleString()}
        </div>
      </div>
    )
  },
})
