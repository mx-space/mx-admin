/**
 * 最近 & 速记
 */
import {
  Plus as AddIcon,
  FileText as ArticleIcon,
  MessageSquare as CommentIcon,
  ExternalLink as ExternalLinkIcon,
  StickyNote as NoteIcon,
  File as PageIcon,
  Pencil as PencilIcon,
  ThumbsDown,
  ThumbsUp,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import { NButton, NPopconfirm, NSkeleton, NTooltip } from 'naive-ui'
import { computed, defineComponent, onMounted, ref, Transition } from 'vue'
import type { RecentlyModel, RecentlyRefTypes } from '~/models/recently'
import type { PropType } from 'vue'

import { recentlyApi } from '~/api'
import { useShorthand } from '~/components/shorthand'
import { RelativeTime } from '~/components/time/relative-time'

import { HeaderActionButton } from '../../components/button/rounded-button'
import { useLayout } from '../../layouts/content'
import styles from './index.module.css'

const RefTypeIcons: Record<RecentlyRefTypes, typeof ArticleIcon> = {
  Post: ArticleIcon,
  Note: NoteIcon,
  Page: PageIcon,
}

const RefTypeLabels: Record<RecentlyRefTypes, string> = {
  Post: '文章',
  Note: '笔记',
  Page: '页面',
}

const RecentlyItem = defineComponent({
  props: {
    item: {
      type: Object as PropType<RecentlyModel>,
      required: true,
    },
    onEdit: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const totalVotes = computed(() => props.item.up + props.item.down)
    const upPercentage = computed(() =>
      totalVotes.value > 0
        ? Math.round((props.item.up / totalVotes.value) * 100)
        : 50,
    )

    const RefIcon = props.item.refType ? RefTypeIcons[props.item.refType] : null
    const refLabel = props.item.refType
      ? RefTypeLabels[props.item.refType]
      : null

    return () => (
      <article class={styles.card} aria-label="速记条目">
        {/* 主内容区域 */}
        <div class={styles.content}>
          <p class={styles.text}>{props.item.content}</p>
        </div>

        {/* 关联引用 */}
        {props.item.ref && props.item.refType && (
          <div class={styles.reference}>
            <a
              href={props.item.ref.url}
              target="_blank"
              rel="noopener noreferrer"
              class={styles.referenceLink}
              aria-label={`查看关联${refLabel}: ${props.item.ref.title}`}
            >
              {RefIcon && <RefIcon class={styles.referenceIcon} />}
              <span class={styles.referenceType}>{refLabel}</span>
              <span class={styles.referenceTitle}>{props.item.ref.title}</span>
              <ExternalLinkIcon class={styles.externalIcon} />
            </a>
          </div>
        )}

        {/* 底部元信息 */}
        <footer class={styles.footer}>
          <div class={styles.meta}>
            {/* 时间信息 */}
            <div class={styles.timeInfo}>
              <time
                datetime={props.item.created}
                class={styles.time}
                aria-label="创建时间"
              >
                <RelativeTime time={props.item.created} />
              </time>
              {props.item.modified && (
                <span class={styles.modified} aria-label="修改时间">
                  <span aria-hidden="true">·</span>
                  <span>编辑于</span>
                  <RelativeTime time={props.item.modified} />
                </span>
              )}
            </div>

            {/* 投票统计 */}
            <div
              class={styles.votes}
              aria-label={`投票统计: ${props.item.up} 赞, ${props.item.down} 踩`}
            >
              <div class={styles.voteItem} aria-hidden="true">
                <ThumbsUp class={styles.voteIcon} />
                <span class={styles.voteCount}>{props.item.up}</span>
              </div>
              <div class={styles.voteDivider} aria-hidden="true" />
              <div class={styles.voteItem} aria-hidden="true">
                <ThumbsDown class={styles.voteIcon} />
                <span class={styles.voteCount}>{props.item.down}</span>
              </div>
              {totalVotes.value > 0 && (
                <div
                  class={styles.voteBar}
                  aria-hidden="true"
                  title={`${upPercentage.value}% 好评率`}
                >
                  <div
                    class={styles.voteBarFill}
                    style={{ width: `${upPercentage.value}%` }}
                  />
                </div>
              )}
            </div>

            {/* 评论数 */}
            {props.item.commentsIndex !== undefined &&
              props.item.commentsIndex > 0 && (
                <div
                  class={styles.comments}
                  aria-label={`${props.item.commentsIndex} 条评论`}
                >
                  <CommentIcon class={styles.commentIcon} />
                  <span>{props.item.commentsIndex}</span>
                </div>
              )}
          </div>

          {/* 操作按钮 */}
          <div class={styles.actions} role="group" aria-label="操作">
            <NTooltip trigger="hover" placement="top">
              {{
                trigger: () => (
                  <button
                    type="button"
                    class={styles.actionButton}
                    onClick={props.onEdit}
                    aria-label="编辑此条目"
                  >
                    <PencilIcon />
                  </button>
                ),
                default: () => '编辑',
              }}
            </NTooltip>

            <NPopconfirm
              placement="left"
              positiveText="取消"
              negativeText="删除"
              onNegativeClick={props.onDelete}
            >
              {{
                trigger: () => (
                  <NTooltip trigger="hover" placement="top">
                    {{
                      trigger: () => (
                        <button
                          type="button"
                          class={[styles.actionButton, styles.deleteButton]}
                          aria-label="删除此条目"
                        >
                          <TrashIcon />
                        </button>
                      ),
                      default: () => '删除',
                    }}
                  </NTooltip>
                ),
                default: () => (
                  <span class="max-w-48 break-all">确定要删除这条速记吗？</span>
                ),
              }}
            </NPopconfirm>
          </div>
        </footer>
      </article>
    )
  },
})

const EmptyState = defineComponent({
  props: {
    onCreate: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class={styles.empty} role="status" aria-label="暂无内容">
        <div class={styles.emptyIcon} aria-hidden="true">
          <NoteIcon />
        </div>
        <h3 class={styles.emptyTitle}>还没有速记</h3>
        <p class={styles.emptyDescription}>记录你的灵感、想法或日常碎片</p>
        <NButton type="primary" onClick={props.onCreate}>
          <AddIcon class="mr-1.5" />
          写一条速记
        </NButton>
      </div>
    )
  },
})

const LoadingSkeleton = defineComponent({
  setup() {
    return () => (
      <div class={styles.list} aria-busy="true" aria-label="加载中">
        {[1, 2, 3].map((i) => (
          <div key={i} class={styles.skeleton}>
            <NSkeleton text repeat={2} />
            <div class={styles.skeletonFooter}>
              <NSkeleton text style={{ width: '120px' }} />
              <NSkeleton text style={{ width: '80px' }} />
            </div>
          </div>
        ))}
      </div>
    )
  },
})

export default defineComponent({
  setup() {
    const { setActions } = useLayout()
    const data = ref([] as RecentlyModel[])
    const loading = ref(true)

    onMounted(async () => {
      recentlyApi.getAll().then((res) => {
        data.value = res
        loading.value = false
      })
    })

    const { create, edit } = useShorthand()

    const handleCreate = () => {
      create().then((res) => {
        if (res) {
          data.value.unshift(res)
        }
      })
    }

    setActions(
      <HeaderActionButton
        onClick={handleCreate}
        icon={<AddIcon />}
        aria-label="新建速记"
      />,
    )

    return () => (
      <div class={styles.container}>
        <Transition name="fade" mode="out-in">
          {loading.value ? (
            <LoadingSkeleton key="loading" />
          ) : data.value.length === 0 ? (
            <EmptyState key="empty" onCreate={handleCreate} />
          ) : (
            <div
              key="list"
              class={styles.list}
              role="feed"
              aria-label="速记列表"
            >
              {data.value.map((item, index) => (
                <RecentlyItem
                  key={item.id}
                  item={item}
                  onEdit={() => {
                    edit(item).then((res) => {
                      if (res) {
                        data.value[index] = res
                      }
                    })
                  }}
                  onDelete={async () => {
                    await recentlyApi.delete(item.id)
                    message.success('删除成功')
                    data.value.splice(data.value.indexOf(item), 1)
                  }}
                />
              ))}
            </div>
          )}
        </Transition>
      </div>
    )
  },
})
