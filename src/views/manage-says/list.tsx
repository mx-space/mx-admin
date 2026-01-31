/**
 * Say List Page
 * 一言列表页面 - 引用风格列表 + 模态框编辑
 */
import { Plus as AddIcon } from 'lucide-vue-next'
import { NPagination } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { SayModel } from '~/models/say'

import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { saysApi } from '~/api/says'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { queryKeys } from '~/hooks/queries/keys'
import { useDataTable } from '~/hooks/use-data-table'
import { useLayout } from '~/layouts/content'

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
    const queryClient = useQueryClient()

    const { data, pager, isLoading } = useDataTable<SayWithMeta>({
      queryKey: (params) => queryKeys.says.list(params),
      queryFn: (params) =>
        saysApi.getList({
          page: params.page,
          size: params.size,
        }) as Promise<any>,
      pageSize: 20,
    })

    // 删除 mutation
    const deleteMutation = useMutation({
      mutationFn: saysApi.delete,
      onSuccess: () => {
        toast.success('删除成功')
        queryClient.invalidateQueries({ queryKey: queryKeys.says.all })
      },
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

    const handleSuccess = () => {
      // 刷新列表
      queryClient.invalidateQueries({ queryKey: queryKeys.says.all })
      handleCloseModal()
    }

    const handleDelete = async (id: string) => {
      deleteMutation.mutate(id)
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
        {isLoading.value && data.value.length === 0 ? (
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
