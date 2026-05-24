import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ExternalLink,
  Folder,
  Inbox,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { ProjectModel } from '~/app/models/project'
import type { ProjectInput } from '../api/projects'

import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
} from '../api/projects'
import { Button } from '../ui/button'
import { CompactPagination } from '../ui/compact-pagination'
import { Panel } from '../ui/panel'
import { TextArea, TextInput } from '../ui/text-field'

const pageSize = 20

type ProjectFormState = ProjectInput & {
  imagesText: string
}

const emptyForm: ProjectFormState = {
  avatar: '',
  description: '',
  docUrl: '',
  images: [],
  imagesText: '',
  name: '',
  previewUrl: '',
  projectUrl: '',
  text: '',
}

export function ProjectsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(readPage(searchParams.get('page')))
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get('id'),
  )
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const projectsQuery = useQuery({
    queryFn: () => getProjects({ page, size: pageSize }),
    queryKey: ['projects', 'list', page, pageSize],
  })
  const projectQuery = useQuery({
    enabled: Boolean(selectedId) && !isCreating,
    queryFn: () => getProject(selectedId!),
    queryKey: ['projects', 'detail', selectedId],
  })

  const projects = projectsQuery.data?.data ?? []
  const pagination = projectsQuery.data?.pagination

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (page > 1) nextParams.set('page', String(page))
    if (selectedId) nextParams.set('id', selectedId)
    setSearchParams(nextParams, { replace: true })
  }, [page, selectedId, setSearchParams])

  const invalidateProjects = async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] })
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Panel
        description={pagination ? `${pagination.total} records` : undefined}
        title={
          <span className="inline-flex items-center gap-2">
            <Folder aria-hidden="true" className="size-4" />
            项目列表
          </span>
        }
      >
        <div className="border-b border-neutral-200 p-3 dark:border-neutral-800">
          <Button
            className="w-full"
            onClick={() => {
              setSelectedId(null)
              setIsEditing(false)
              setIsCreating(true)
            }}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            新建项目
          </Button>
        </div>

        <div className="min-h-[28rem]">
          {projectsQuery.isLoading && projects.length === 0 ? (
            <ProjectListSkeleton />
          ) : projects.length === 0 ? (
            <ProjectEmptyState />
          ) : (
            projects.map((project) => (
              <ProjectListItem
                key={project.id}
                onSelect={() => {
                  setSelectedId(project.id)
                  setIsCreating(false)
                  setIsEditing(false)
                }}
                project={project}
                selected={selectedId === project.id}
              />
            ))
          )}
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
            <CompactPagination
              onPageChange={setPage}
              onPageSizeChange={() => undefined}
              page={page}
              pageCount={pagination.totalPages}
              pageSize={pageSize}
              pageSizes={[pageSize]}
            />
          </div>
        ) : null}
      </Panel>

      <ProjectWorkspace
        isCreating={isCreating}
        isEditing={isEditing}
        onClose={() => {
          setSelectedId(null)
          setIsCreating(false)
          setIsEditing(false)
        }}
        onCreated={async (project) => {
          setIsCreating(false)
          setSelectedId(project.id)
          await invalidateProjects()
        }}
        onDeleted={async () => {
          setSelectedId(null)
          setIsCreating(false)
          setIsEditing(false)
          await invalidateProjects()
        }}
        onEdit={() => setIsEditing(true)}
        onSaved={async () => {
          setIsEditing(false)
          await invalidateProjects()
        }}
        onStopEditing={() => setIsEditing(false)}
        project={projectQuery.data ?? null}
        projectLoading={projectQuery.isLoading}
        selectedId={selectedId}
      />
    </div>
  )
}

function ProjectListItem(props: {
  onSelect: () => void
  project: ProjectModel
  selected: boolean
}) {
  return (
    <button
      className={[
        'flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/60',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50',
      ].join(' ')}
      onClick={props.onSelect}
      type="button"
    >
      <ProjectAvatar project={props.project} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {props.project.name}
          </span>
          {props.project.projectUrl ? (
            <ExternalLink
              aria-hidden="true"
              className="size-3 shrink-0 text-neutral-400"
            />
          ) : null}
        </span>
        {props.project.description ? (
          <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
            {props.project.description}
          </span>
        ) : null}
        <time
          className="mt-1 block text-xs text-neutral-400"
          dateTime={props.project.createdAt}
        >
          {formatDate(props.project.createdAt)}
        </time>
      </span>
    </button>
  )
}

function ProjectWorkspace(props: {
  isCreating: boolean
  isEditing: boolean
  onClose: () => void
  onCreated: (project: ProjectModel) => Promise<void>
  onDeleted: () => Promise<void>
  onEdit: () => void
  onSaved: () => Promise<void>
  onStopEditing: () => void
  project: ProjectModel | null
  projectLoading: boolean
  selectedId: string | null
}) {
  if (props.isCreating) {
    return (
      <ProjectFormPanel
        mode="create"
        onCancel={props.onClose}
        onSuccess={props.onCreated}
        project={null}
      />
    )
  }

  if (props.selectedId && props.projectLoading) return <ProjectDetailSkeleton />

  if (props.project && props.isEditing) {
    return (
      <ProjectFormPanel
        mode="edit"
        onCancel={props.onStopEditing}
        onSuccess={props.onSaved}
        project={props.project}
      />
    )
  }

  if (props.project) {
    return (
      <ProjectDetailPanel
        onClose={props.onClose}
        onDeleted={props.onDeleted}
        onEdit={props.onEdit}
        project={props.project}
      />
    )
  }

  return (
    <Panel title="项目详情">
      <div className="flex min-h-[32rem] flex-col items-center justify-center p-8 text-center">
        <Folder aria-hidden="true" className="mb-4 size-10 text-neutral-300" />
        <h2 className="text-base font-medium">选择一个项目</h2>
        <p className="mt-1 text-sm text-neutral-500">
          从左侧列表选择项目，或新建一个项目。
        </p>
      </div>
    </Panel>
  )
}

function ProjectDetailPanel(props: {
  onClose: () => void
  onDeleted: () => Promise<void>
  onEdit: () => void
  project: ProjectModel
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: async () => {
      toast.success('删除成功')
      await props.onDeleted()
    },
  })

  return (
    <Panel
      title={
        <span className="inline-flex items-center gap-2">
          <ProjectAvatar project={props.project} size="small" />
          {props.project.name}
        </span>
      }
    >
      <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button onClick={props.onClose} type="button" variant="subtle">
            <ArrowLeft aria-hidden="true" className="size-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={props.onEdit} type="button" variant="subtle">
              <Pencil aria-hidden="true" className="size-4" />
              编辑
            </Button>
            <Button
              className="text-red-600 hover:text-red-700 dark:text-red-400"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (isConfirmingDelete) {
                  deleteMutation.mutate(props.project.id)
                } else {
                  setIsConfirmingDelete(true)
                }
              }}
              onMouseLeave={() => setIsConfirmingDelete(false)}
              type="button"
              variant="subtle"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {isConfirmingDelete ? '确认删除' : '删除'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5">
        {props.project.description ? (
          <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            {props.project.description}
          </p>
        ) : null}
        <ProjectLinks project={props.project} />
        <pre className="max-h-[36rem] overflow-auto whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
          {props.project.text || 'No content.'}
        </pre>
      </div>
    </Panel>
  )
}

function ProjectFormPanel(props: {
  mode: 'create' | 'edit'
  onCancel: () => void
  onSuccess: (project: ProjectModel) => Promise<void>
  project: ProjectModel | null
}) {
  const [form, setForm] = useState<ProjectFormState>(() =>
    props.project ? projectToForm(props.project) : emptyForm,
  )
  const [error, setError] = useState('')
  const isEdit = props.mode === 'edit' && Boolean(props.project?.id)
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = formToPayload(form)

      if (props.project?.id) return updateProject(props.project.id, payload)

      return createProject(payload)
    },
    onSuccess: async (project) => {
      toast.success(isEdit ? '保存成功' : '创建成功')
      await props.onSuccess(project)
    },
  })

  useEffect(() => {
    setForm(props.project ? projectToForm(props.project) : emptyForm)
    setError('')
  }, [props.project])

  const updateField = (key: keyof ProjectFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('项目名称不能为空')
      return
    }
    if (!form.text.trim()) {
      setError('项目内容不能为空')
      return
    }

    setError('')
    mutation.mutate()
  }

  return (
    <Panel title={isEdit ? '编辑项目' : '新建项目'}>
      <form className="grid gap-4 p-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="项目名称"
            onChange={(value) => updateField('name', value)}
            required
            value={form.name}
          />
          <TextInput
            label="头像 URL"
            onChange={(value) => updateField('avatar', value)}
            value={form.avatar ?? ''}
          />
        </div>
        <TextInput
          label="描述"
          onChange={(value) => updateField('description', value)}
          value={form.description}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            label="项目 URL"
            onChange={(value) => updateField('projectUrl', value)}
            value={form.projectUrl ?? ''}
          />
          <TextInput
            label="预览 URL"
            onChange={(value) => updateField('previewUrl', value)}
            value={form.previewUrl ?? ''}
          />
          <TextInput
            label="文档 URL"
            onChange={(value) => updateField('docUrl', value)}
            value={form.docUrl ?? ''}
          />
        </div>
        <TextArea
          controlClassName="min-h-20"
          label="图片 URL"
          onChange={(value) => updateField('imagesText', value)}
          placeholder="一行一个图片 URL"
          value={form.imagesText}
        />
        <TextArea
          controlClassName="min-h-72 font-mono"
          label="内容"
          onChange={(value) => updateField('text', value)}
          required
          value={form.text}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button onClick={props.onCancel} type="button" variant="subtle">
            <X aria-hidden="true" className="size-4" />
            取消
          </Button>
          <Button disabled={mutation.isPending} type="submit">
            <Save aria-hidden="true" className="size-4" />
            {isEdit ? '保存' : '创建'}
          </Button>
        </div>
      </form>
    </Panel>
  )
}

function ProjectLinks(props: { project: ProjectModel }) {
  const links = [
    ['Project', props.project.projectUrl],
    ['Preview', props.project.previewUrl],
    ['Docs', props.project.docUrl],
  ] as const

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(([label, href]) =>
        href ? (
          <a
            className="inline-flex h-8 items-center gap-1 rounded border border-neutral-200 px-2 text-xs text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-900"
            href={href}
            key={label}
            rel="noreferrer"
            target="_blank"
          >
            {label}
            <ExternalLink aria-hidden="true" className="size-3" />
          </a>
        ) : null,
      )}
    </div>
  )
}

function ProjectAvatar(props: {
  project: Pick<ProjectModel, 'avatar' | 'name'>
  size?: 'normal' | 'small'
}) {
  const sizeClass =
    props.size === 'small' ? 'size-6 text-xs' : 'size-10 text-sm'

  if (props.project.avatar) {
    return (
      <img
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-700`}
        src={props.project.avatar}
      />
    )
  }

  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-neutral-100 font-semibold uppercase text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700`}
    >
      {readInitial(props.project.name)}
    </span>
  )
}

function ProjectEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Inbox aria-hidden="true" className="mb-4 size-10 text-neutral-300" />
      <p className="text-sm text-neutral-500">暂无项目</p>
      <p className="mt-1 text-xs text-neutral-400">点击按钮创建项目</p>
    </div>
  )
}

function ProjectListSkeleton() {
  return (
    <div className="animate-pulse p-4">
      {[1, 2, 3, 4, 5].map((index) => (
        <div className="mb-4 flex gap-3" key={index}>
          <div className="size-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="flex-1">
            <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="mt-2 h-3 w-full rounded bg-neutral-100 dark:bg-neutral-900" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProjectDetailSkeleton() {
  return (
    <Panel title="Loading project">
      <div className="animate-pulse p-5">
        <div className="h-6 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-4 h-4 w-full rounded bg-neutral-100 dark:bg-neutral-900" />
        <div className="mt-2 h-4 w-4/5 rounded bg-neutral-100 dark:bg-neutral-900" />
        <div className="mt-8 h-72 rounded bg-neutral-100 dark:bg-neutral-900" />
      </div>
    </Panel>
  )
}

function projectToForm(project: ProjectModel): ProjectFormState {
  return {
    avatar: project.avatar ?? '',
    description: project.description ?? '',
    docUrl: project.docUrl ?? '',
    images: project.images ?? [],
    imagesText: (project.images ?? []).join('\n'),
    name: project.name ?? '',
    previewUrl: project.previewUrl ?? '',
    projectUrl: project.projectUrl ?? '',
    text: project.text ?? '',
  }
}

function formToPayload(form: ProjectFormState): ProjectInput {
  return {
    avatar: emptyToUndefined(form.avatar),
    description: form.description.trim(),
    docUrl: emptyToUndefined(form.docUrl),
    images: form.imagesText
      .split('\n')
      .map((image) => image.trim())
      .filter(Boolean),
    name: form.name.trim(),
    previewUrl: emptyToUndefined(form.previewUrl),
    projectUrl: emptyToUndefined(form.projectUrl),
    text: form.text.trim(),
  }
}

function emptyToUndefined(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function readInitial(value: string) {
  return value.slice(0, 1).toUpperCase()
}

function readPage(value: string | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
