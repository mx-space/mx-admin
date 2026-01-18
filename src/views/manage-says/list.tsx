/**
 * Say List Page
 * 一言列表页面 - 引用风格列表 + 模态框编辑
 */
import { Plus as AddIcon } from 'lucide-vue-next'
import { NPagination } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import type { SayModel, SayResponse } from '~/models/say'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { useDataTableFetch } from '~/hooks/use-table'
import { useLayout } from '~/layouts/content'
import { RESTManager } from '~/utils/rest'

import {
  SayEditModal,
  SayEmptyState,
  SayListItem,
  SayListSkeleton,
} from './components/say-list-item'

interface SayWithMeta extends SayModel {
  created?: string
  modified?: string
}

const ManageSayListView = defineComponent({
  name: 'SayList',
  setup() {
    const route = useRoute()
    const router = useRouter()

    const { data, pager, loading, fetchDataFn } =
      useDataTableFetch<SayWithMeta>(
        (data, pager) =>
          async (page = route.query.page || 1, size = 20) => {
            const response = await RESTManager.api.says.get<SayResponse>({
              params: {
                page,
                size,
                select: 'text _id id created modified author source',
              },
            })
            data.value = response.data as SayWithMeta[]
            pager.value = response.pagination
          },
      )

    const fetchData = fetchDataFn

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

    // 模态框状态
    const showModal = ref(false)
    const editingSay = ref<SayWithMeta | null>(null)

    const handleCreate = () => {
      editingSay.value = null
      showModal.value = true
    }

    const handleEdit = (say: SayWithMeta) => {
      editingSay.value = say
      showModal.value = true
    }

    const handleCloseModal = () => {
      showModal.value = false
      editingSay.value = null
    }

    const handleSuccess = (result: SayWithMeta) => {
      if (editingSay.value) {
        // 编辑：更新列表中的项
        const index = data.value.findIndex((s) => s.id === result.id)
        if (index !== -1) {
          data.value[index] = result
        }
      } else {
        // 创建：添加到列表开头
        data.value.unshift(result)
      }
      handleCloseModal()
    }

    const handleDelete = async (id: string) => {
      await RESTManager.api.says(id).delete()
      message.success('删除成功')
      const index = data.value.findIndex((s) => s.id === id)
      if (index !== -1) {
        data.value.splice(index, 1)
      }
    }

    const { setActions } = useLayout()

    setActions(
      <HeaderActionButton
        onClick={handleCreate}
        icon={<AddIcon />}
        name="添加一言"
      />,
    )

    return () => (
      <div class="space-y-4">
        {/* 内容区域 */}
        {loading.value && data.value.length === 0 ? (
          // 加载骨架屏
          <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <SayListSkeleton />
          </div>
        ) : data.value.length === 0 ? (
          // 空状态
          <SayEmptyState onCreate={handleCreate} />
        ) : (
          // 列表
          <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {data.value.map((say) => (
              <SayListItem
                key={say.id}
                say={say}
                onEdit={() => handleEdit(say)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* 分页 */}
        {pager.value && pager.value.totalPage > 1 && (
          <div class="flex justify-center">
            <NPagination
              page={pager.value.currentPage}
              onUpdatePage={(page) => {
                router.replace({
                  query: { ...route.query, page },
                  params: { ...route.params },
                })
              }}
              pageCount={pager.value.totalPage}
              pageSize={pager.value.size}
              showQuickJumper
            />
          </div>
        )}

        {/* 编辑/创建模态框 */}
        <SayEditModal
          show={showModal.value}
          say={editingSay.value}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      </div>
    )
  },
})

export default ManageSayListView
