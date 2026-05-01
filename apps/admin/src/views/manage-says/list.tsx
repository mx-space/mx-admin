import { Plus as AddIcon } from 'lucide-vue-next'
import { NPagination } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { SayWithMeta } from './components/say-list-item'

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

    const deleteMutation = useMutation({
      mutationFn: saysApi.delete,
      onSuccess: () => {
        toast.success('删除成功')
        queryClient.invalidateQueries({ queryKey: queryKeys.says.all })
      },
    })

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
      queryClient.invalidateQueries({ queryKey: queryKeys.says.all })
      handleCloseModal()
    }

    const handleDelete = (id: string) => {
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
        {isLoading.value && data.value.length === 0 ? (
          <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <SayListSkeleton />
          </div>
        ) : data.value.length === 0 ? (
          <SayEmptyState onCreate={handleCreate} />
        ) : (
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
