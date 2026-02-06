import {
  CheckCheck as CheckAllIcon,
  ShieldAlert as SpamIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import { useDialog } from 'naive-ui'
import {
  computed,
  defineComponent,
  Fragment,
  onMounted,
  ref,
  watch,
  watchEffect,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { CommentModel } from '~/models/comment'

import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { commentsApi } from '~/api/comments'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { MasterDetailLayout, useMasterDetailLayout } from '~/components/layout'
import { queryKeys } from '~/hooks/queries/keys'
import { useDataTable } from '~/hooks/use-data-table'
import { useLayout } from '~/layouts/content'
import { CommentState } from '~/models/comment'
import { RouteName } from '~/router/name'

import { CommentDetail } from './components/comment-detail'
import { CommentEmptyState } from './components/comment-empty-state'
import { CommentList } from './components/comment-list'

enum CommentType {
  Pending,
  Marked,
  Trash,
}

const ManageComment = defineComponent(() => {
  const route = useRoute()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setActions } = useLayout()
  const { isMobile } = useMasterDetailLayout()

  const tabValue = ref(
    (+(route.query.state as string) as CommentType) || CommentType.Pending,
  )

  const selectedId = ref<string | null>((route.query.id as string) || null)
  const showDetailOnMobile = ref(false)
  const selectedCommentSnapshot = ref<CommentModel | null>(null)

  const {
    data,
    checkedRowKeys,
    pager,
    isLoading: loading,
    setPage,
  } = useDataTable<CommentModel>({
    queryKey: (params) =>
      queryKeys.comments.list(params.filters?.state ?? 0, params),
    queryFn: async (params) => {
      const response = await commentsApi.getList({
        page: params.page,
        size: params.size,
        state: params.filters?.state ?? 0,
      })
      return {
        data: response.data.map((data) => {
          Reflect.deleteProperty(data, 'children')
          return data
        }),
        pagination: response.pagination,
      }
    },
    pageSize: 20,
    filters: () => ({ state: tabValue.value }),
  })

  const selectedComment = computed(() => {
    if (!selectedId.value) return null
    const fromList = data.value.find((c) => c.id === selectedId.value)
    if (fromList) return fromList
    if (
      selectedCommentSnapshot.value &&
      selectedCommentSnapshot.value.id === selectedId.value
    ) {
      return selectedCommentSnapshot.value
    }
    return null
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      commentsApi.ownerReply(id, text),
    onSuccess: () => {
      toast.success('回复成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    },
  })

  const updateStateMutation = useMutation({
    mutationFn: async ({
      ids,
      state,
    }: {
      ids: string | string[]
      state: CommentState
    }) => {
      if (Array.isArray(ids)) {
        await Promise.all(ids.map((id) => commentsApi.updateState(id, state)))
      } else {
        await commentsApi.updateState(ids, state)
      }
    },
    onSuccess: () => {
      toast.success('操作成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (ids: string | string[]) => {
      if (Array.isArray(ids)) {
        await Promise.allSettled(ids.map((id) => commentsApi.delete(id)))
      } else {
        await commentsApi.delete(ids)
      }
    },
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    },
  })

  const changeState = (id: string | string[], state: CommentState) => {
    updateStateMutation.mutate({ ids: id, state })
  }

  const handleDelete = (id: string | string[]) => {
    if (id === selectedId.value) {
      selectedId.value = null
      showDetailOnMobile.value = false
    }
    deleteMutation.mutate(id)
  }

  const handleReply = async (id: string, text: string) => {
    await replyMutation.mutateAsync({ id, text })
  }

  const selectAllMode = ref(false)

  const handleCheck = (id: string, checked: boolean) => {
    selectAllMode.value = false
    if (checked) {
      checkedRowKeys.value.push(id)
    } else {
      checkedRowKeys.value = checkedRowKeys.value.filter((k) => k !== id)
    }
  }

  const handleCheckAll = (checked: boolean) => {
    selectAllMode.value = false
    if (checked) {
      checkedRowKeys.value = data.value.map((d) => d.id)
    } else {
      checkedRowKeys.value = []
    }
  }

  const handleSelectAll = () => {
    selectAllMode.value = true
    checkedRowKeys.value = data.value.map((d) => d.id)
  }

  const handleSelect = (comment: CommentModel) => {
    selectedId.value = comment.id
    selectedCommentSnapshot.value = { ...comment }
    if (isMobile.value) {
      showDetailOnMobile.value = true
    }
  }

  const handleBack = () => {
    showDetailOnMobile.value = false
  }

  const handleFilterChange = (value: number) => {
    checkedRowKeys.value = []
    selectAllMode.value = false
    selectedId.value = null
    selectedCommentSnapshot.value = null
    showDetailOnMobile.value = false
    tabValue.value = value
  }

  const totalCount = computed(() => pager.value?.total ?? 0)
  const dialog = useDialog()

  const batchOperationLoading = ref(false)

  const handleBatchChangeState = async (state: CommentState) => {
    batchOperationLoading.value = true
    try {
      if (selectAllMode.value) {
        await commentsApi.batchUpdateState({
          all: true,
          state,
          currentState: tabValue.value,
        })
      } else {
        await commentsApi.batchUpdateState({
          ids: checkedRowKeys.value.concat(),
          state,
        })
      }
      toast.success('操作成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    } finally {
      batchOperationLoading.value = false
      selectAllMode.value = false
      checkedRowKeys.value = []
    }
  }

  const handleBatchDelete = async () => {
    batchOperationLoading.value = true
    try {
      if (selectAllMode.value) {
        await commentsApi.batchDelete({
          all: true,
          state: tabValue.value,
        })
      } else {
        await commentsApi.batchDelete({
          ids: checkedRowKeys.value.concat(),
        })
      }
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    } finally {
      batchOperationLoading.value = false
      selectAllMode.value = false
      checkedRowKeys.value = []
    }
  }

  const selectedCountDisplay = computed(() =>
    selectAllMode.value ? totalCount.value : checkedRowKeys.value.length,
  )

  watchEffect(() => {
    setActions(
      <Fragment>
        {tabValue.value !== CommentType.Marked && (
          <HeaderActionButton
            name="全部已读"
            disabled={
              checkedRowKeys.value.length === 0 || batchOperationLoading.value
            }
            icon={<CheckAllIcon />}
            variant="success"
            onClick={() => handleBatchChangeState(CommentState.Read)}
          />
        )}

        {tabValue.value !== CommentType.Trash && (
          <HeaderActionButton
            name="标记垃圾"
            disabled={
              checkedRowKeys.value.length === 0 || batchOperationLoading.value
            }
            icon={<SpamIcon />}
            variant="warning"
            onClick={() => handleBatchChangeState(CommentState.Junk)}
          />
        )}

        <HeaderActionButton
          name="删除选中"
          icon={<TrashIcon />}
          variant="error"
          disabled={
            checkedRowKeys.value.length === 0 || batchOperationLoading.value
          }
          onClick={() => {
            dialog.warning({
              title: '删除确认',
              content: `确定要删除选中的 ${selectedCountDisplay.value} 条评论吗？`,
              positiveText: '删除',
              negativeText: '取消',
              onPositiveClick: handleBatchDelete,
            })
          }}
        />
      </Fragment>,
    )
  })

  watch(
    [selectedId, tabValue],
    ([id, state]) => {
      router.replace({
        name: RouteName.Comment,
        query: {
          state,
          ...(id ? { id } : {}),
        },
      })
    },
    { flush: 'post' },
  )

  onMounted(() => {
    if (route.query.id) {
      selectedId.value = route.query.id as string
    }
  })

  return () => (
    <MasterDetailLayout
      showDetailOnMobile={showDetailOnMobile.value}
      defaultSize={0.35}
      min={0.25}
      max={0.5}
    >
      {{
        list: () => (
          <CommentList
            data={data.value}
            loading={loading.value}
            checkedKeys={checkedRowKeys.value}
            selectedId={selectedId.value}
            pager={pager.value}
            selectAllMode={selectAllMode.value}
            filterValue={tabValue.value}
            onCheck={handleCheck}
            onCheckAll={handleCheckAll}
            onSelectAll={handleSelectAll}
            onSelect={handleSelect}
            onPageChange={setPage}
            onFilterChange={handleFilterChange}
          />
        ),
        detail: () =>
          selectedComment.value ? (
            <CommentDetail
              comment={selectedComment.value}
              currentTab={tabValue.value}
              isMobile={isMobile.value}
              replyLoading={replyMutation.isPending.value}
              onBack={handleBack}
              onChangeState={changeState}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          ) : null,
        empty: () => <CommentEmptyState />,
      }}
    </MasterDetailLayout>
  )
})

export default ManageComment
