import {
  BookOpen as BookOpenIcon,
  Clock as ClockIcon,
  ExternalLink as ExternalLinkIcon,
  Globe as GlobeIcon,
  Heart as HeartIcon,
  MapPin as MapPinIcon,
  Timer as TimerIcon,
  User as UserIcon,
} from 'lucide-vue-next'
import { NTabPane, NTabs } from 'naive-ui'
import { defineComponent, onBeforeMount, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import type {
  NoteModel,
  PageModel,
  PaginateResult,
  PostModel,
  RecentlyModel,
} from '@mx-space/api-client'
import type { ActivityReadDurationType } from '~/models/activity'
import type { PropType, Ref } from 'vue'

import { IpInfoPopover } from '~/components/ip-info'
import { Table } from '~/components/table'
import { RelativeTime } from '~/components/time/relative-time'
import { useDataTableFetch } from '~/hooks/use-table'
import { RESTManager } from '~/utils'

import styles from '../index.module.css'

interface ActivityItem {
  id: string
  created: string
  payload: any
  type: number
}

enum ActivityType {
  Like,
  ReadDuration,
}

type WithObjects<T> = {
  objects: {
    posts: PostModel[]
    notes: NoteModel[]
    pages: PageModel[]
    recentlies: RecentlyModel[]
  }
} & T

type ObjectsCollection = {
  posts: Record<string, PostModel>
  notes: Record<string, NoteModel>
  pages: Record<string, PageModel>
  recentlies: Record<string, RecentlyModel>

  all: Record<string, PostModel | NoteModel | PageModel | RecentlyModel>
}

const refObjectCollectionRef = shallowRef({
  posts: {},
  notes: {},
  pages: {},
  recentlies: {},

  all: {},
} as ObjectsCollection)

const mapDataToCollection = (
  type: keyof ObjectsCollection,
  data: WithObjects<{}>['objects'],
) => {
  const collection = refObjectCollectionRef.value[type]
  for (const list in data[type]) {
    const item = data[type][list]
    collection[item.id] = item
    refObjectCollectionRef.value.all[item.id] = item
  }
}

export const GuestActivity = defineComponent({
  setup() {
    const tabValue = ref(ActivityType.Like)

    const { data, pager, fetchDataFn } = useDataTableFetch(
      (list, pager) => async (page, size) => {
        RESTManager.api.activity
          .get<WithObjects<PaginateResult<ActivityItem>>>({
            params: { page, size, type: tabValue.value },
          })
          .then((res) => {
            list.value = res.data
            pager.value = res.pagination

            if (res.objects) {
              mapDataToCollection('posts', res.objects)
              mapDataToCollection('notes', res.objects)
              mapDataToCollection('pages', res.objects)
              mapDataToCollection('recentlies', res.objects)
            }
          })
      },
    )

    onBeforeMount(() => {
      fetchDataFn()
    })

    const route = useRoute()
    watch(
      () => route.query.page,
      async (n) => {
        await fetchDataFn(n ? +n : 1)
      },
    )

    return () => {
      return (
        <div class={styles.tableCard}>
          <NTabs
            onUpdateValue={(value) => {
              tabValue.value = value
              fetchDataFn()
            }}
            value={tabValue.value}
            type="line"
          >
            <NTabPane tab="点赞记录" name={ActivityType.Like}>
              <div />
            </NTabPane>
            <NTabPane tab="阅读记录" name={ActivityType.ReadDuration}>
              <div />
            </NTabPane>
          </NTabs>

          {tabValue.value === ActivityType.Like ? (
            <LikeActivityList data={data} pager={pager} onFetch={fetchDataFn} />
          ) : (
            <ReadDurationList data={data} pager={pager} onFetch={fetchDataFn} />
          )}
        </div>
      )
    }
  },
})

const LikeActivityList = defineComponent({
  props: {
    data: {
      type: Object as () => Ref<any[]>,
      required: true,
    },
    pager: {
      type: Object as () => Ref<any>,
      required: true,
    },
    onFetch: {
      type: Function as PropType<(page?: any) => void>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      if (!props.data.value?.length) {
        return (
          <div class={styles.empty}>
            <div class={styles.emptyIcon}>
              <HeartIcon />
            </div>
            <h3 class={styles.emptyTitle}>暂无点赞记录</h3>
            <p class={styles.emptyDescription}>访客的点赞活动将显示在这里</p>
          </div>
        )
      }

      return (
        <div class={styles.activityList}>
          {props.data.value.map((item: any) => (
            <LikeActivityItem key={item.id} item={item} />
          ))}
          {props.pager.value && (
            <Table
              data={props.data}
              pager={props.pager}
              onFetchData={props.onFetch}
              columns={[]}
              noPagination={false}
            />
          )}
        </div>
      )
    }
  },
})

const LikeActivityItem = defineComponent({
  props: {
    item: {
      type: Object as () => {
        id: string
        created: string
        payload: any
        type: number
        ref?: NoteModel | PostModel
      },
      required: true,
    },
  },
  setup(props) {
    const handleOpenRef = () => {
      if (!props.item.payload?.id) return
      RESTManager.api
        .helper('url-builder')(props.item.payload.id)
        .get<{ data: string }>()
        .then(({ data: url }) => {
          window.open(url)
        })
    }

    return () => (
      <article class={styles.activityItem} aria-label="点赞活动">
        <div class={styles.activityHeader}>
          <div class={styles.activityType}>
            <span class={[styles.activityBadge, styles.activityBadgeLike]}>
              <HeartIcon class="size-3" />
              <span>点赞</span>
            </span>
          </div>
          <time class={styles.activityTime} datetime={props.item.created}>
            <RelativeTime time={props.item.created} />
          </time>
        </div>

        <div class={styles.activityContent}>
          {props.item.ref ? (
            <button
              type="button"
              class={styles.activityRef}
              onClick={handleOpenRef}
              aria-label={`查看文章: ${props.item.ref.title}`}
            >
              <BookOpenIcon class={styles.activityRefIcon} />
              <span class={styles.activityRefTitle}>
                {props.item.ref.title}
              </span>
              <ExternalLinkIcon class="size-3.5 text-neutral-400" />
            </button>
          ) : (
            <span class="text-sm text-neutral-400">已删除的内容</span>
          )}
        </div>

        <div class={styles.activityMeta}>
          <IpInfoPopover
            ip={props.item.payload.ip}
            trigger="hover"
            triggerEl={
              <div class={styles.activityMetaItem}>
                <GlobeIcon class={styles.activityMetaIcon} />
                <span class="font-mono">{props.item.payload.ip}</span>
              </div>
            }
          />
        </div>
      </article>
    )
  },
})

const ReadDurationList = defineComponent({
  props: {
    data: {
      type: Object as () => Ref<any[]>,
      required: true,
    },
    pager: {
      type: Object as () => Ref<any>,
      required: true,
    },
    onFetch: {
      type: Function as PropType<(page?: any) => void>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      if (!props.data.value?.length) {
        return (
          <div class={styles.empty}>
            <div class={styles.emptyIcon}>
              <TimerIcon />
            </div>
            <h3 class={styles.emptyTitle}>暂无阅读记录</h3>
            <p class={styles.emptyDescription}>访客的阅读时长将显示在这里</p>
          </div>
        )
      }

      return (
        <div class={styles.activityList}>
          {props.data.value.map((item: ActivityReadDurationType) => (
            <ReadDurationItem key={item.id} item={item} />
          ))}
          {props.pager.value && (
            <Table
              data={props.data}
              pager={props.pager}
              onFetchData={props.onFetch}
              columns={[]}
              noPagination={false}
            />
          )}
        </div>
      )
    }
  },
})

const ReadDurationItem = defineComponent({
  props: {
    item: {
      type: Object as () => ActivityReadDurationType,
      required: true,
    },
  },
  setup(props) {
    const ref = computed(
      () => refObjectCollectionRef.value.all[props.item.refId],
    )

    const duration = computed(() => {
      const totalSeconds =
        (props.item.payload.operationTime - props.item.payload.connectedAt) /
        1000
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = Math.floor(totalSeconds % 60)

      let timeString = ''
      if (hours > 0) {
        timeString += `${hours}小时 `
      }
      if (hours > 0 || minutes > 0) {
        timeString += `${minutes}分钟 `
      }
      timeString += `${seconds}秒`
      return timeString
    })

    const maxDuration = 3600000 // 1 hour as max for bar
    const durationPercentage = computed(() => {
      const ms =
        props.item.payload.operationTime - props.item.payload.connectedAt
      return Math.min((ms / maxDuration) * 100, 100)
    })

    const handleOpenRef = () => {
      if (!ref.value?.id) return
      RESTManager.api
        .helper('url-builder')(ref.value.id)
        .get<{ data: string }>()
        .then(({ data: url }) => {
          window.open(url)
        })
    }

    return () => (
      <article class={styles.activityItem} aria-label="阅读活动">
        <div class={styles.activityHeader}>
          <div class={styles.activityType}>
            <span class={[styles.activityBadge, styles.activityBadgeRead]}>
              <BookOpenIcon class="size-3" />
              <span>阅读</span>
            </span>
            {(props.item.payload.displayName ||
              props.item.payload.identity) && (
              <span class="ml-2 flex items-center gap-1 text-sm text-neutral-500">
                <UserIcon class="size-3.5" />
                {props.item.payload.displayName || props.item.payload.identity}
              </span>
            )}
          </div>
          <time class={styles.activityTime} datetime={props.item.created}>
            <RelativeTime time={props.item.created} />
          </time>
        </div>

        <div class={styles.activityContent}>
          {ref.value ? (
            <button
              type="button"
              class={styles.activityRef}
              onClick={handleOpenRef}
              aria-label={`查看文章: ${(ref.value as any).title}`}
            >
              <BookOpenIcon class={styles.activityRefIcon} />
              <span class={styles.activityRefTitle}>
                {(ref.value as any).title}
              </span>
              <ExternalLinkIcon class="size-3.5 text-neutral-400" />
            </button>
          ) : (
            <span class="text-sm text-neutral-400">未知内容</span>
          )}
        </div>

        {/* Duration Bar */}
        <div class="mb-3">
          <div class="mb-1 flex items-center justify-between text-sm">
            <span class="flex items-center gap-1.5 text-neutral-500">
              <TimerIcon class="size-4" />
              阅读时长
            </span>
            <span class="font-medium text-neutral-700 dark:text-neutral-200">
              {duration.value}
            </span>
          </div>
          <div class={styles.durationBar}>
            <div
              class={styles.durationBarFill}
              style={{ width: `${durationPercentage.value}%` }}
            />
          </div>
        </div>

        <div class={styles.activityMeta}>
          <IpInfoPopover
            ip={props.item.payload.ip}
            trigger="hover"
            triggerEl={
              <div class={styles.activityMetaItem}>
                <GlobeIcon class={styles.activityMetaIcon} />
                <span class="font-mono">{props.item.payload.ip}</span>
              </div>
            }
          />

          <div class={styles.activityMetaItem}>
            <ClockIcon class={styles.activityMetaIcon} />
            <span>
              连接于{' '}
              <RelativeTime time={new Date(props.item.payload.connectedAt)} />
            </span>
          </div>

          {props.item.payload.position > 0 && (
            <div class={styles.activityMetaItem}>
              <MapPinIcon class={styles.activityMetaIcon} />
              <span>位置 {props.item.payload.position}%</span>
            </div>
          )}
        </div>
      </article>
    )
  },
})
