import {
  Plus as AddIcon,
  ExternalLink,
  Folder,
  Pencil,
  Trash2,
} from 'lucide-vue-next'
import {
  NAvatar,
  NButton,
  NCheckbox,
  NPagination,
  NPopconfirm,
  useMessage,
} from 'naive-ui'
import { computed, defineComponent, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type { ProjectModel, ProjectResponse } from '~/models/project'
import type { PropType } from 'vue'

import { DeleteConfirmButton } from '~/components/special-button/delete-confirm'
import { RelativeTime } from '~/components/time/relative-time'
import { useStoreRef } from '~/hooks/use-store-ref'
import { useDataTableFetch } from '~/hooks/use-table'
import { UIStore } from '~/stores/ui'

import { HeaderActionButton } from '../../components/button/rounded-button'
import { useLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'

// 项目卡片组件
const ProjectCard = defineComponent({
  name: 'ProjectCard',
  props: {
    data: {
      type: Object as PropType<ProjectModel>,
      required: true,
    },
    checked: {
      type: Boolean,
      default: false,
    },
    onCheckedChange: {
      type: Function as PropType<(checked: boolean) => void>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const item = computed(() => props.data)

    return () => (
      <div class="group flex items-start gap-3 border-b border-neutral-200 px-4 py-3 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50">
        {/* Checkbox */}
        <div class="flex shrink-0 pt-1">
          <NCheckbox
            checked={props.checked}
            onUpdateChecked={props.onCheckedChange}
            aria-label={`选择项目 ${item.value.name}`}
          />
        </div>

        {/* Avatar */}
        <div class="shrink-0">
          {item.value.avatar ? (
            <NAvatar
              round
              size={40}
              src={item.value.avatar}
              fallbackSrc=""
              class="ring-1 ring-neutral-200 dark:ring-neutral-700"
            />
          ) : (
            <NAvatar
              round
              size={40}
              class="bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700"
            >
              {item.value.name[0]?.toUpperCase() || 'P'}
            </NAvatar>
          )}
        </div>

        {/* Content */}
        <div class="min-w-0 flex-1">
          {/* Title row */}
          <div class="flex items-center gap-2">
            {item.value.projectUrl ? (
              <a
                href={item.value.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="truncate text-[14px] font-medium text-neutral-900 hover:text-blue-600 hover:underline dark:text-neutral-100 dark:hover:text-blue-400"
              >
                {item.value.name}
              </a>
            ) : (
              <span class="truncate text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                {item.value.name}
              </span>
            )}
            {item.value.projectUrl && (
              <ExternalLink class="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            )}
          </div>

          {/* Description */}
          {item.value.description && (
            <p class="mt-1 line-clamp-2 text-[13px] text-neutral-600 dark:text-neutral-400">
              {item.value.description}
            </p>
          )}

          {/* Meta row */}
          <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-neutral-500 dark:text-neutral-400">
            <RelativeTime time={item.value.created} />
            {item.value.modified && (
              <>
                <span>·</span>
                <span class="flex items-center gap-1">
                  更新于 <RelativeTime time={item.value.modified} />
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          {item.value.projectUrl && (
            <a
              href={item.value.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`访问 ${item.value.name} 项目`}
            >
              <NButton quaternary size="tiny" class="!px-2">
                {{
                  icon: () => <ExternalLink class="h-4 w-4 text-neutral-500" />,
                }}
              </NButton>
            </a>
          )}

          <RouterLink
            to={`/projects/edit?id=${item.value.id}`}
            aria-label={`编辑项目 ${item.value.name}`}
          >
            <NButton quaternary size="tiny" class="!px-2">
              {{
                icon: () => <Pencil class="h-4 w-4 text-neutral-500" />,
              }}
            </NButton>
          </RouterLink>

          <NPopconfirm
            positiveText="取消"
            negativeText="删除"
            onNegativeClick={() => props.onDelete(item.value.id)}
          >
            {{
              trigger: () => (
                <NButton
                  quaternary
                  size="tiny"
                  class="!px-2"
                  aria-label={`删除项目 ${item.value.name}`}
                >
                  {{
                    icon: () => <Trash2 class="h-4 w-4 text-red-500" />,
                  }}
                </NButton>
              ),
              default: () => (
                <span class="max-w-48">
                  确定要删除「{item.value.name}」吗？
                </span>
              ),
            }}
          </NPopconfirm>
        </div>
      </div>
    )
  },
})

const ManageProjectView = defineComponent({
  setup() {
    const { data, pager, fetchDataFn, loading } =
      useDataTableFetch<ProjectModel>(
        (data, pager) =>
          async (page = route.query.page || 1, size = 30) => {
            const response =
              await RESTManager.api.projects.get<ProjectResponse>({
                params: {
                  page,
                  size,
                },
              })
            data.value = response.data
            pager.value = response.pagination
          },
      )

    const checkedRowKeys = reactive(new Set<string>())
    const message = useMessage()
    const route = useRoute()
    const fetchData = fetchDataFn

    const ui = useStoreRef(UIStore)
    const isMobile = computed(
      () => ui.viewport.value.mobile || ui.viewport.value.pad,
    )

    watch(
      () => route.query.page,
      async (n) => {
        // @ts-expect-error
        await fetchData(n)
      },
    )

    onMounted(async () => {
      await fetchData()
    })

    const handleDelete = async (id: string) => {
      await RESTManager.api.projects(id).delete()
      message.success('删除成功')
      checkedRowKeys.delete(id)
      await fetchData(pager.value.currentPage)
    }

    const { setActions } = useLayout()

    watchEffect(() => {
      setActions(
        <>
          <DeleteConfirmButton
            checkedRowKeys={checkedRowKeys}
            onDelete={async () => {
              await Promise.all(
                Array.from(checkedRowKeys.values()).map((id) => {
                  return RESTManager.api.projects(id as string).delete()
                }),
              )
              checkedRowKeys.clear()
              message.success('删除成功')
              fetchData()
            }}
          />

          <HeaderActionButton to={'/projects/edit'} icon={<AddIcon />} />
        </>,
      )
    })

    // 空状态组件
    const EmptyState = () => (
      <div class="flex flex-col items-center justify-center py-20">
        <div class="mb-4 rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
          <Folder class="h-8 w-8 text-neutral-400" />
        </div>
        <p class="text-[14px] text-neutral-600 dark:text-neutral-400">
          暂无项目
        </p>
        <RouterLink
          to="/projects/edit"
          class="mt-4 text-[14px] text-blue-500 hover:text-blue-600 hover:underline"
        >
          创建第一个项目
        </RouterLink>
      </div>
    )

    // 加载状态
    const LoadingState = () => (
      <div class="flex items-center justify-center py-20">
        <span class="text-[14px] text-neutral-400">加载中…</span>
      </div>
    )

    // 分页组件
    const Pagination = () => {
      if (pager.value.totalPage <= 1) return null

      return isMobile.value ? (
        <div class="flex items-center justify-center gap-4 border-t border-neutral-200 py-4 dark:border-neutral-800">
          <button
            class="rounded-md border border-neutral-200 px-3 py-1.5 text-[13px] transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            disabled={!pager.value.hasPrevPage}
            onClick={() => {
              if (pager.value.hasPrevPage) {
                fetchData(pager.value.currentPage - 1)
              }
            }}
          >
            上一页
          </button>
          <span class="text-[13px] text-neutral-500 dark:text-neutral-400">
            {pager.value.currentPage} / {pager.value.totalPage}
          </span>
          <button
            class="rounded-md border border-neutral-200 px-3 py-1.5 text-[13px] transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            disabled={!pager.value.hasNextPage}
            onClick={() => {
              if (pager.value.hasNextPage) {
                fetchData(pager.value.currentPage + 1)
              }
            }}
          >
            下一页
          </button>
        </div>
      ) : (
        <div class="flex justify-end border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <NPagination
            itemCount={pager.value.total}
            pageCount={pager.value.totalPage}
            page={pager.value.currentPage}
            pageSize={pager.value.size}
            onUpdatePage={(page) => {
              fetchData(page)
            }}
          />
        </div>
      )
    }

    return () => (
      <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {loading.value ? (
          <LoadingState />
        ) : data.value.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {data.value.map((item) => (
              <ProjectCard
                key={item.id}
                data={item}
                checked={checkedRowKeys.has(item.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    checkedRowKeys.add(item.id)
                  } else {
                    checkedRowKeys.delete(item.id)
                  }
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        <Pagination />
      </div>
    )
  },
})

export default ManageProjectView
