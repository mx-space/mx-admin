/**
 * Project List Page
 * 项目列表页面 - Master-Detail 布局
 */
import { Plus as PlusIcon } from 'lucide-vue-next'
import { defineComponent, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { ProjectModel } from '~/models/project'

import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { projectsApi } from '~/api/projects'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { MasterDetailLayout, useMasterDetailLayout } from '~/components/layout'
import { queryKeys } from '~/hooks/queries/keys'
import { useDataTable } from '~/hooks/use-data-table'
import { useLayout } from '~/layouts/content'
import { RouteName } from '~/router/name'

import {
  ProjectCreatePanel,
  ProjectDetailEmptyState,
  ProjectDetailPanel,
} from './components/project-detail-panel'
import { ProjectList } from './components/project-list'

export default defineComponent({
  name: 'ProjectListPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const queryClient = useQueryClient()
    const { setActions } = useLayout()
    const { isMobile } = useMasterDetailLayout()

    const {
      data: projects,
      pager: pagination,
      isLoading: loading,
      setPage,
    } = useDataTable<ProjectModel>({
      queryKey: (params) => queryKeys.projects.list(params),
      queryFn: (params) =>
        projectsApi.getList({ page: params.page, size: params.size }),
      pageSize: 20,
    })

    const selectedId = ref<string | null>((route.query.id as string) || null)
    const showDetailOnMobile = ref(false)
    const isCreating = ref(false)

    const handleAddProject = () => {
      isCreating.value = true
      selectedId.value = null
      if (isMobile.value) {
        showDetailOnMobile.value = true
      }
    }

    const handleCancelCreate = () => {
      isCreating.value = false
    }

    const handleCreated = (project: ProjectModel) => {
      isCreating.value = false
      selectedId.value = project.id
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    }

    const deleteMutation = useMutation({
      mutationFn: projectsApi.delete,
      onSuccess: () => {
        toast.success('删除成功')
        if (selectedId.value) {
          selectedId.value = null
          showDetailOnMobile.value = false
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      },
    })

    const handleDelete = (id: string) => {
      deleteMutation.mutate(id)
    }

    const handleSelect = (project: ProjectModel) => {
      isCreating.value = false
      selectedId.value = project.id!
      if (isMobile.value) {
        showDetailOnMobile.value = true
      }
    }

    const handleBack = () => {
      showDetailOnMobile.value = false
    }

    const handleSaved = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    }

    watch(
      selectedId,
      (id) => {
        router.replace({
          name: RouteName.ListProject,
          query: {
            ...(id ? { id } : {}),
          },
        })
      },
      { flush: 'post' },
    )

    watchEffect(() => {
      setActions(
        <HeaderActionButton
          icon={<PlusIcon />}
          onClick={handleAddProject}
          variant="success"
          name="新建项目"
        />,
      )
    })

    return () => (
      <MasterDetailLayout
        showDetailOnMobile={showDetailOnMobile.value}
        defaultSize={0.3}
        min={0.2}
        max={0.4}
      >
        {{
          list: () => (
            <ProjectList
              data={projects.value}
              loading={loading.value}
              selectedId={selectedId.value}
              pager={pagination.value}
              onSelect={handleSelect}
              onPageChange={setPage}
            />
          ),
          detail: () =>
            isCreating.value ? (
              <ProjectCreatePanel
                isMobile={isMobile.value}
                onBack={handleBack}
                onCancel={handleCancelCreate}
                onCreated={handleCreated}
              />
            ) : selectedId.value ? (
              <ProjectDetailPanel
                projectId={selectedId.value}
                isMobile={isMobile.value}
                onBack={handleBack}
                onDelete={handleDelete}
                onSaved={handleSaved}
              />
            ) : null,
          empty: () => <ProjectDetailEmptyState />,
        }}
      </MasterDetailLayout>
    )
  },
})
