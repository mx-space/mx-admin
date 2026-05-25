import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Code2,
  ExternalLink,
  Folder,
  ImageIcon,
  Import as ImportIcon,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { FormEvent, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { ProjectModel } from '~/app/models/project'
import type { GithubRepo } from '../api/github-repo'
import type { ProjectInput } from '../api/projects'

import { getRepoDetail, getRepoReadme } from '../api/github-repo'
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
} from '../api/projects'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { CompactPagination } from '../ui/compact-pagination'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { MarkdownRender } from '../ui/markdown-render'
import { MasterDetailLayout } from '../ui/page-layout'
import { Scroll } from '../ui/scroll'
import { TextArea, TextInput } from '../ui/text-field'
import { relativeTimeFromNow } from '../utils/time'

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
  const searchParamsKey = searchParams.toString()
  const [page, setPage] = useState(readPage(searchParams.get('page')))
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get('id'),
  )
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false)

  const projectsQuery = useQuery({
    placeholderData: (previous) => previous,
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

  useLayoutEffect(() => {
    const nextPage = readPage(searchParams.get('page'))
    const nextSelectedId = searchParams.get('id')

    setPage((value) => (value === nextPage ? value : nextPage))
    setSelectedId((value) =>
      value === nextSelectedId ? value : nextSelectedId,
    )

    if (nextSelectedId) {
      setIsCreating(false)
      setIsEditing(false)
      setShowDetailOnMobile(true)
    } else if (!isCreating) {
      setIsEditing(false)
      setShowDetailOnMobile(false)
    }
  }, [isCreating, searchParamsKey])

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (page > 1) nextParams.set('page', String(page))
    if (selectedId) nextParams.set('id', selectedId)
    if (nextParams.toString() !== searchParamsKey) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [page, searchParamsKey, selectedId, setSearchParams])

  const invalidateProjects = async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] })
  }

  return (
    <MasterDetailLayout
      defaultSize={0.36}
      list={
        <section className="flex h-full min-h-0 flex-col border-r border-neutral-200 dark:border-neutral-800">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="min-w-0">
              <h2 className="inline-flex items-center gap-2 text-sm font-medium text-neutral-950 dark:text-neutral-50">
                <Folder aria-hidden="true" className="size-4" />
                项目列表
              </h2>
            </div>
            {pagination ? (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {pagination.total} 个
              </span>
            ) : null}
            <Button
              onClick={() => {
                setSelectedId(null)
                setIsEditing(false)
                setIsCreating(true)
                setShowDetailOnMobile(true)
              }}
              type="button"
              variant="subtle"
            >
              <Plus aria-hidden="true" className="size-4" />
              新建项目
            </Button>
          </div>

          <Scroll className="flex-1">
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
                    setShowDetailOnMobile(true)
                  }}
                  project={project}
                  selected={selectedId === project.id}
                />
              ))
            )}
          </Scroll>

          {pagination && pagination.totalPages > 1 ? (
            <div className="shrink-0 border-t border-neutral-200 p-3 dark:border-neutral-800">
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
        </section>
      }
      showDetailOnMobile={showDetailOnMobile}
      detail={
        <ProjectWorkspace
          isCreating={isCreating}
          isEditing={isEditing}
          onClose={() => {
            setSelectedId(null)
            setIsCreating(false)
            setIsEditing(false)
            setShowDetailOnMobile(false)
          }}
          onMobileBack={() => setShowDetailOnMobile(false)}
          onCreated={async (project) => {
            setIsCreating(false)
            setSelectedId(project.id)
            setShowDetailOnMobile(true)
            await invalidateProjects()
          }}
          onDeleted={async () => {
            setSelectedId(null)
            setIsCreating(false)
            setIsEditing(false)
            setShowDetailOnMobile(false)
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
          showDetailOnMobile={showDetailOnMobile}
        />
      }
    />
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
  onMobileBack: () => void
  onSaved: () => Promise<void>
  onStopEditing: () => void
  project: ProjectModel | null
  projectLoading: boolean
  selectedId: string | null
  showDetailOnMobile: boolean
}) {
  const workspaceClassName = 'h-full min-h-0'

  if (props.isCreating) {
    return (
      <section className={workspaceClassName}>
        <ProjectFormPanel
          mode="create"
          onCancel={props.onClose}
          onMobileBack={props.onMobileBack}
          onSuccess={props.onCreated}
          project={null}
        />
      </section>
    )
  }

  if (props.selectedId && props.projectLoading) {
    return (
      <section className={workspaceClassName}>
        <ProjectDetailSkeleton />
      </section>
    )
  }

  if (props.project && props.isEditing) {
    return (
      <section className={workspaceClassName}>
        <ProjectFormPanel
          mode="edit"
          onCancel={props.onStopEditing}
          onMobileBack={props.onMobileBack}
          onSuccess={props.onSaved}
          project={props.project}
        />
      </section>
    )
  }

  if (props.project) {
    return (
      <section className={workspaceClassName}>
        <ProjectDetailPanel
          onClose={props.onClose}
          onDeleted={props.onDeleted}
          onEdit={props.onEdit}
          onMobileBack={props.onMobileBack}
          project={props.project}
        />
      </section>
    )
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <div
        className={cn(
          'flex shrink-0 items-center border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <h2 className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
          项目详情
        </h2>
      </div>
      <div className="flex min-h-[32rem] flex-col items-center justify-center p-8 text-center">
        <Folder aria-hidden="true" className="mb-4 size-10 text-neutral-300" />
        <h2 className="text-base font-medium">选择一个项目</h2>
        <p className="mt-1 text-sm text-neutral-500">
          从左侧列表选择项目，或新建一个项目。
        </p>
      </div>
    </section>
  )
}

function ProjectDetailPanel(props: {
  onClose: () => void
  onDeleted: () => Promise<void>
  onEdit: () => void
  onMobileBack: () => void
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

  const images = props.project.images?.filter(Boolean) ?? []

  return (
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="min-w-0">
          <h2 className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-neutral-950 dark:text-neutral-50">
            <ProjectAvatar project={props.project} size="small" />
            <span className="truncate">{props.project.name}</span>
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            className="lg:hidden"
            onClick={props.onMobileBack}
            type="button"
            variant="subtle"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            返回
          </Button>
          <Button
            className="hidden lg:inline-flex"
            onClick={props.onClose}
            type="button"
            variant="subtle"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            关闭
          </Button>
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

      <Scroll className="flex-1">
        <div className="mx-auto grid max-w-3xl gap-6 p-6">
          <div className="flex items-start gap-4">
            <ProjectAvatar project={props.project} size="large" />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                {props.project.name}
              </h3>
              {props.project.description ? (
                <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                  {props.project.description}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                <time dateTime={props.project.createdAt}>
                  创建于 {relativeTimeFromNow(props.project.createdAt)}
                </time>
              </div>
            </div>
          </div>

          <ProjectLinks project={props.project} />

          {images.length > 0 ? <ProjectImageGrid images={images} /> : null}

          {props.project.text ? (
            <section className="border-t border-neutral-100 pt-5 dark:border-neutral-800">
              <h4 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                项目介绍
              </h4>
              <MarkdownRender text={props.project.text} />
            </section>
          ) : (
            <p className="border-t border-neutral-100 pt-5 text-sm text-neutral-500 dark:border-neutral-800">
              暂无项目介绍。
            </p>
          )}
        </div>
      </Scroll>
    </section>
  )
}

function ProjectFormPanel(props: {
  mode: 'create' | 'edit'
  onCancel: () => void
  onMobileBack: () => void
  onSuccess: (project: ProjectModel) => Promise<void>
  project: ProjectModel | null
}) {
  const [form, setForm] = useState<ProjectFormState>(() =>
    props.project ? projectToForm(props.project) : emptyForm,
  )
  const [githubImportOpen, setGithubImportOpen] = useState(false)
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

  const applyGithubRepo = (repo: GithubRepo, readme: string | null) => {
    const images = pickImagesFromMarkdown(readme ?? '')

    setForm((current) => ({
      ...current,
      description: repo.description ?? '',
      images,
      imagesText: images.join('\n'),
      name: repo.name || current.name,
      previewUrl: repo.homepage ?? '',
      projectUrl: repo.html_url || current.projectUrl,
      text: readme ?? current.text,
    }))
    setGithubImportOpen(false)
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
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Button
            aria-label="返回项目列表"
            className="h-8 px-2 lg:hidden"
            onClick={props.onMobileBack}
            type="button"
            variant="subtle"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Button>
          <h2 className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {isEdit ? '编辑项目' : '新建项目'}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            onClick={() => setGithubImportOpen((value) => !value)}
            type="button"
            variant="subtle"
          >
            <ImportIcon aria-hidden="true" className="size-4" />从 GitHub 获取
          </Button>
          <Button onClick={props.onCancel} type="button" variant="subtle">
            <X aria-hidden="true" className="size-4" />
            取消
          </Button>
          <Button
            disabled={mutation.isPending}
            form="project-form"
            type="submit"
          >
            <Save aria-hidden="true" className="size-4" />
            {isEdit ? '保存' : '创建'}
          </Button>
        </div>
      </div>

      <Scroll className="flex-1">
        <form id="project-form" onSubmit={handleSubmit}>
          <div className="mx-auto grid max-w-3xl gap-4 p-6">
            {githubImportOpen ? (
              <GithubImportPanel
                defaultValue={form.projectUrl}
                onApply={applyGithubRepo}
              />
            ) : null}
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
            <ImagePreview imagesText={form.imagesText} />
            <TextArea
              controlClassName="min-h-72 font-mono"
              label="内容"
              onChange={(value) => updateField('text', value)}
              required
              value={form.text}
            />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
          </div>
        </form>
      </Scroll>
    </section>
  )
}

function ProjectLinks(props: { project: ProjectModel }) {
  const links = [
    ['源码', props.project.projectUrl, Code2],
    ['预览', props.project.previewUrl, ExternalLink],
    ['文档', props.project.docUrl, ExternalLink],
  ] as const

  return (
    <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-5 dark:border-neutral-800">
      {links.map(([label, href, Icon]) =>
        href ? (
          <a
            className="inline-flex h-8 items-center gap-1.5 rounded bg-neutral-100 px-3 text-xs text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            href={href}
            key={label}
            rel="noreferrer"
            target="_blank"
          >
            <Icon aria-hidden="true" className="size-3.5" />
            {label}
          </a>
        ) : null,
      )}
    </div>
  )
}

function ProjectImageGrid(props: { images: string[] }) {
  return (
    <section className="border-t border-neutral-100 pt-5 dark:border-neutral-800">
      <h4 className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        <ImageIcon aria-hidden="true" className="size-4" />
        预览图片
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {props.images.map((image, index) => (
          <a
            className="group block overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900"
            href={image}
            key={`${image}-${index}`}
            rel="noreferrer"
            target="_blank"
          >
            <img
              alt={`预览图 ${index + 1}`}
              className="h-32 w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              src={image}
            />
          </a>
        ))}
      </div>
    </section>
  )
}

function ImagePreview(props: { imagesText: string }) {
  const images = useMemo(
    () =>
      props.imagesText
        .split('\n')
        .map((image) => image.trim())
        .filter(Boolean),
    [props.imagesText],
  )

  if (images.length === 0) return null

  return <ProjectImageGrid images={images} />
}

function GithubImportPanel(props: {
  defaultValue?: string
  onApply: (repo: GithubRepo, readme: string | null) => void
}) {
  const [url, setUrl] = useState(props.defaultValue ?? '')
  const importMutation = useMutation({
    mutationFn: async () => {
      const repo = parseGithubRepo(url)
      const [detail, readme] = await Promise.all([
        getRepoDetail(repo.owner, repo.repo),
        getRepoReadme(repo.owner, repo.repo),
      ])

      return { detail, readme }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'GitHub 仓库解析失败'))
    },
    onSuccess: ({ detail, readme }) => {
      props.onApply(detail, readme)
      toast.success('已填充 GitHub 项目信息')
    },
  })

  return (
    <section className="grid gap-3 border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
        <ImportIcon aria-hidden="true" className="size-4" />从 GitHub 仓库导入
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <TextInput
          className="flex-1"
          onChange={setUrl}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              importMutation.mutate()
            }
          }}
          placeholder="https://github.com/owner/repo"
          value={url}
        />
        <Button
          disabled={importMutation.isPending}
          onClick={() => importMutation.mutate()}
          type="button"
        >
          {importMutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <ImportIcon aria-hidden="true" className="size-4" />
          )}
          获取
        </Button>
      </div>
    </section>
  )
}

function ProjectAvatar(props: {
  project: Pick<ProjectModel, 'avatar' | 'name'>
  size?: 'large' | 'normal' | 'small'
}) {
  const sizeClass =
    props.size === 'large'
      ? 'size-14 text-xl'
      : props.size === 'small'
        ? 'size-6 text-xs'
        : 'size-10 text-sm'

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
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <div
        className={cn(
          'flex shrink-0 items-center border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <h2 className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
          Loading project
        </h2>
      </div>
      <div className="animate-pulse p-6">
        <div className="h-6 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-4 h-4 w-full rounded bg-neutral-100 dark:bg-neutral-900" />
        <div className="mt-2 h-4 w-4/5 rounded bg-neutral-100 dark:bg-neutral-900" />
        <div className="mt-8 h-72 rounded bg-neutral-100 dark:bg-neutral-900" />
      </div>
    </section>
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

function parseGithubRepo(value: string) {
  const trimmed = value
    .trim()
    .replace(/\.git$/, '')
    .replace(/\/$/, '')
  const path = trimmed.startsWith('http')
    ? new URL(trimmed).pathname.replace(/^\/+/, '')
    : trimmed
  const [owner, repo] = path.split('/')

  if (!owner || !repo) throw new Error('请输入有效的 GitHub 仓库地址')

  return { owner, repo }
}

function pickImagesFromMarkdown(text: string) {
  const images: string[] = []
  const imagePattern = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g

  for (const match of text.matchAll(imagePattern)) {
    if (match[1]) images.push(match[1])
  }

  return images
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error

  return fallback
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
