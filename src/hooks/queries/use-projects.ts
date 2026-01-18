import { computed, toValue } from 'vue'
import type {
  CreateProjectData,
  GetProjectsParams,
  UpdateProjectData,
} from '~/api/projects'
import type { MaybeRefOrGetter } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { projectsApi } from '~/api/projects'

import { queryKeys } from './keys'

/**
 * 项目列表查询
 */
export const useProjectsQuery = (
  params?: MaybeRefOrGetter<GetProjectsParams>,
) => {
  return useQuery({
    queryKey: computed(() => queryKeys.projects.list(toValue(params))),
    queryFn: () => projectsApi.getList(toValue(params)),
  })
}

/**
 * 单个项目查询
 */
export const useProjectQuery = (id: MaybeRefOrGetter<string>) => {
  return useQuery({
    queryKey: computed(() => queryKeys.projects.detail(toValue(id))),
    queryFn: () => projectsApi.getById(toValue(id)),
    enabled: computed(() => !!toValue(id)),
  })
}

/**
 * 创建项目
 */
export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProjectData) => projectsApi.create(data),
    onSuccess: () => {
      window.message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

/**
 * 更新项目
 */
export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      projectsApi.update(id, data),
    onSuccess: (_, { id }) => {
      window.message.success('修改成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
    },
  })
}

/**
 * 删除项目
 */
export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      window.message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}
