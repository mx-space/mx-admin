import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  Check,
  Clock,
  Eye,
  File as FileIcon,
  FileText,
  History,
  Loader2,
  Save,
  WandSparkles,
} from 'lucide-react'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type {
  MountRichEditorOptions,
  RichEditorHandle,
} from '@mx-admin/rich-react'
import type { CategoryModel } from '~/app/models/category'
import type { DraftModel } from '~/app/models/draft'
import type { NoteModel } from '~/app/models/note'
import type { PageModel } from '~/app/models/page'
import type { PostModel } from '~/app/models/post'
import type { TopicModel } from '~/app/models/topic'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { CreateDraftData } from '../api/drafts'

import { API_URL } from '~/app/constants/env'
import { DraftRefType } from '~/app/models/draft'

import { AiQueryType, writerGenerate } from '../api/ai'
import { getCategories } from '../api/categories'
import {
  createDraft,
  getDraftByRef,
  getNewDrafts,
  updateDraft,
} from '../api/drafts'
import { uploadFile } from '../api/files'
import { createNote, getNoteById, updateNote } from '../api/notes'
import { createPage, getPageById, updatePage } from '../api/pages'
import { createPost, getPostById, updatePost } from '../api/posts'
import { getTopics } from '../api/topics'
import { Button } from '../ui/button'
import { SelectField } from '../ui/select'
import { Switch } from '../ui/switch'
import { TextArea, TextInput } from '../ui/text-field'

type WriteKind = 'note' | 'page' | 'post'
type ContentFormat = 'lexical' | 'markdown'

interface WriteFormState {
  categoryId: string
  content: string
  contentFormat: ContentFormat
  copyright: boolean
  isPublished: boolean
  order: string
  slug: string
  subtitle: string
  summary: string
  tags: string
  text: string
  title: string
  topicId: string
}

const emptyState: WriteFormState = {
  categoryId: '',
  content: '',
  contentFormat: 'markdown',
  copyright: true,
  isPublished: true,
  order: '',
  slug: '',
  subtitle: '',
  summary: '',
  tags: '',
  text: '',
  title: '',
  topicId: '',
}

const emptyCategories: CategoryModel[] = []
const emptyTopics: TopicModel[] = []

const kindConfig: Record<
  WriteKind,
  {
    description: string
    icon: LucideIcon
    listPath: string
    queryKey: string
    title: string
  }
> = {
  note: {
    description: '编辑手记正文、slug、发布状态与专栏关联。',
    icon: BookOpen,
    listPath: '/notes',
    queryKey: 'notes',
    title: '手记写作',
  },
  page: {
    description: '编辑静态页面正文、slug、排序与副标题。',
    icon: FileIcon,
    listPath: '/pages',
    queryKey: 'pages',
    title: '页面写作',
  },
  post: {
    description: '编辑文章正文、分类、标签、摘要与发布状态。',
    icon: FileText,
    listPath: '/posts',
    queryKey: 'posts',
    title: '文章写作',
  },
}

export function PostWritePage() {
  return <WritePage kind="post" />
}

export function NoteWritePage() {
  return <WritePage kind="note" />
}

export function PageWritePage() {
  return <WritePage kind="page" />
}

function WritePage(props: { kind: WriteKind }) {
  const config = kindConfig[props.kind]
  const Icon = config.icon
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const isEditing = Boolean(id)
  const [state, setState] = useState<WriteFormState>(emptyState)
  const [preview, setPreview] = useState(false)
  const [draftId, setDraftId] = useState('')
  const draftRefType = draftRefTypeByKind[props.kind]

  const categoriesQuery = useQuery({
    enabled: props.kind === 'post',
    queryFn: () => getCategories({ type: 'Category' }),
    queryKey: ['categories', 'list'],
  })
  const topicsQuery = useQuery({
    enabled: props.kind === 'note',
    queryFn: () => getTopics({ page: 1, size: 100 }),
    queryKey: ['topics', 'list', 'write'],
  })
  const detailQuery = useQuery<WriteModel>({
    enabled: isEditing,
    queryFn: () => getWriteDetail(props.kind, id),
    queryKey: [config.queryKey, 'write-detail', id],
  })
  const refDraftQuery = useQuery({
    enabled: isEditing,
    queryFn: () => getDraftByRef(draftRefType, id),
    queryKey: ['drafts', 'by-ref', draftRefType, id],
  })
  const newDraftsQuery = useQuery({
    enabled: !isEditing,
    queryFn: () => getNewDrafts(draftRefType),
    queryKey: ['drafts', 'new', draftRefType],
  })

  const categories = categoriesQuery.data ?? emptyCategories
  const topics = topicsQuery.data?.data ?? emptyTopics
  const firstCategoryId = categories[0]?.id ?? ''
  const availableDraft = useMemo(() => {
    if (refDraftQuery.data) return refDraftQuery.data

    return [...(newDraftsQuery.data ?? [])].sort(
      (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    )[0]
  }, [newDraftsQuery.data, refDraftQuery.data])

  useEffect(() => {
    if (!detailQuery.data) {
      if (props.kind !== 'post' || !firstCategoryId) return
      setState((previous) =>
        previous.categoryId
          ? previous
          : {
              ...previous,
              categoryId: firstCategoryId,
            },
      )
      return
    }

    setState(fromModel(props.kind, detailQuery.data))
  }, [detailQuery.data, firstCategoryId, props.kind])

  useEffect(() => {
    if (refDraftQuery.data && !draftId) {
      setDraftId(refDraftQuery.data.id)
    }
  }, [draftId, refDraftQuery.data])

  const saveMutation = useMutation<WriteModel>({
    mutationFn: () => saveWrite(props.kind, id, state),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '保存失败')),
    onSuccess: async (result) => {
      toast.success(isEditing ? '已保存' : '已创建')
      await queryClient.invalidateQueries({ queryKey: [config.queryKey] })
      if (!isEditing) {
        const nextParams = new URLSearchParams(searchParams)
        nextParams.set('id', result.id)
        setSearchParams(nextParams, { replace: true })
      }
    },
  })
  const draftMutation = useMutation({
    mutationFn: () => {
      const data = toDraftData(props.kind, state, isEditing ? id : undefined)
      return draftId ? updateDraft(draftId, data) : createDraft(data)
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '保存草稿失败')),
    onSuccess: async (draft) => {
      setDraftId(draft.id)
      toast.success('草稿已保存')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['drafts'] }),
        isEditing ? refDraftQuery.refetch() : newDraftsQuery.refetch(),
      ])
    },
  })
  const draftMutationRef = useRef(draftMutation)
  draftMutationRef.current = draftMutation
  const writerGenerateMutation = useMutation({
    mutationFn: () => {
      const trimmedTitle = state.title.trim()
      const trimmedText = state.text.trim()

      if (trimmedTitle) {
        return writerGenerate({
          title: trimmedTitle,
          type: AiQueryType.Slug,
        })
      }

      return writerGenerate({
        text: trimmedText,
        type: AiQueryType.TitleSlug,
      })
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, 'AI 生成失败')),
    onSuccess: (result) => {
      setState((previous) => ({
        ...previous,
        slug: result.slug || previous.slug,
        title: result.title || previous.title,
      }))
      toast.success('AI 生成已应用')
    },
  })

  const validationError = useMemo(
    () => validateState(props.kind, state, categories),
    [categories, props.kind, state],
  )

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (validationError) {
      toast.error(validationError)
      return
    }

    saveMutation.mutate()
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (!draftMutationRef.current.isPending) {
          draftMutationRef.current.mutate()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const updateField = <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => {
    setState((previous) => ({ ...previous, [key]: value }))
  }

  const applyDraft = (draft: DraftModel) => {
    setDraftId(draft.id)
    setState((previous) => fromDraft(props.kind, draft, previous))
    toast.success('已套用草稿')
  }

  const generateTitleOrSlug = () => {
    if (!state.title.trim() && !state.text.trim()) {
      toast.error('请输入标题或正文后再生成')
      return
    }

    writerGenerateMutation.mutate()
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <section className="rounded border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-neutral-950 dark:text-neutral-50">
              <Icon aria-hidden="true" className="size-4" />
              {config.title}
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {config.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setPreview((value) => !value)}
              type="button"
              variant="subtle"
            >
              <Eye aria-hidden="true" className="size-4" />
              {preview ? '编辑' : '预览'}
            </Button>
            <Button
              onClick={() => navigate(config.listPath)}
              type="button"
              variant="subtle"
            >
              返回列表
            </Button>
            <Button
              disabled={saveMutation.isPending || detailQuery.isLoading}
              type="submit"
            >
              {saveMutation.isPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="size-4" />
              )}
              保存
            </Button>
          </div>
        </div>

        {detailQuery.isLoading ? (
          <WriteSkeleton />
        ) : (
          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <main className="min-w-0 space-y-4">
              <TextInput
                controlClassName="h-11 text-base focus:border-neutral-400"
                label="标题"
                onChange={(value) => updateField('title', value)}
                required
                value={state.title}
              />

              <div className="inline-flex w-fit rounded border border-neutral-200 bg-neutral-50 p-1 text-sm dark:border-neutral-800 dark:bg-neutral-900">
                {(['markdown', 'lexical'] as const).map((format) => (
                  <button
                    className={[
                      'h-8 rounded px-3 font-medium transition-colors',
                      state.contentFormat === format
                        ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-neutral-50'
                        : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
                    ].join(' ')}
                    key={format}
                    onClick={() => updateField('contentFormat', format)}
                    type="button"
                  >
                    {format === 'markdown' ? 'Markdown' : 'Lexical'}
                  </button>
                ))}
              </div>

              {preview ? (
                <PreviewPanel text={state.text} />
              ) : state.contentFormat === 'lexical' ? (
                <RichWriteSurface
                  content={state.content}
                  kind={props.kind}
                  key={`${props.kind}:${id || 'new'}:${state.contentFormat}`}
                  onContentChange={(content) => updateField('content', content)}
                  onTextChange={(text) => updateField('text', text)}
                />
              ) : (
                <TextArea
                  controlClassName="min-h-[34rem] resize-y font-mono text-sm leading-6 focus:border-neutral-400"
                  label="正文"
                  onChange={(value) => updateField('text', value)}
                  required
                  value={state.text}
                />
              )}
            </main>

            <aside className="space-y-4">
              <PanelBlock title="发布">
                <Switch
                  checked={state.isPublished}
                  label="发布状态"
                  onCheckedChange={(checked) =>
                    updateField('isPublished', checked)
                  }
                />
                {saveMutation.data ? (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <Check aria-hidden="true" className="size-4" />
                    已保存 ID: {saveMutation.data.id}
                  </div>
                ) : null}
              </PanelBlock>

              <PanelBlock title="草稿">
                <div className="space-y-3 text-sm">
                  {availableDraft ? (
                    <div className="rounded border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <History aria-hidden="true" className="size-4" />
                        <span>
                          版本 {availableDraft.version} ·{' '}
                          {formatDateTime(availableDraft.updatedAt)}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-neutral-800 dark:text-neutral-200">
                        {availableDraft.title || '未命名草稿'}
                      </p>
                      <Button
                        className="mt-3 w-full"
                        onClick={() => applyDraft(availableDraft)}
                        type="button"
                        variant="subtle"
                      >
                        套用草稿
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      暂无可恢复草稿。
                    </p>
                  )}

                  <Button
                    className="w-full"
                    disabled={draftMutation.isPending}
                    onClick={() => draftMutation.mutate()}
                    type="button"
                    variant="subtle"
                  >
                    {draftMutation.isPending ? (
                      <Loader2
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                    ) : (
                      <Clock aria-hidden="true" className="size-4" />
                    )}
                    保存草稿
                  </Button>
                  {draftMutation.data ? (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      最近保存：{formatDateTime(draftMutation.data.updatedAt)}
                    </p>
                  ) : null}
                </div>
              </PanelBlock>

              <PanelBlock title="路径">
                <TextInput
                  controlClassName="h-9 font-mono focus:border-neutral-400"
                  label="Slug"
                  onChange={(value) => updateField('slug', value)}
                  required={props.kind !== 'note'}
                  value={state.slug}
                />
                <Button
                  className="w-full"
                  disabled={writerGenerateMutation.isPending}
                  onClick={generateTitleOrSlug}
                  type="button"
                  variant="subtle"
                >
                  {writerGenerateMutation.isPending ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <WandSparkles aria-hidden="true" className="size-4" />
                  )}
                  {state.title.trim() ? '生成 Slug' : '生成标题与 Slug'}
                </Button>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  有标题时生成 Slug；无标题时根据正文生成标题与 Slug。
                </p>
              </PanelBlock>

              {props.kind === 'post' ? (
                <PostFields
                  categories={categories}
                  state={state}
                  updateField={updateField}
                />
              ) : null}

              {props.kind === 'note' ? (
                <NoteFields
                  state={state}
                  topics={topics}
                  updateField={updateField}
                />
              ) : null}

              {props.kind === 'page' ? (
                <PageFields state={state} updateField={updateField} />
              ) : null}
            </aside>
          </div>
        )}
      </section>
    </form>
  )
}

function PostFields(props: {
  categories: CategoryModel[]
  state: WriteFormState
  updateField: <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => void
}) {
  return (
    <>
      <PanelBlock title="分类">
        <Field label="分类" required>
          <SelectField
            aria-label="分类"
            onValueChange={(categoryId) =>
              props.updateField('categoryId', categoryId)
            }
            options={props.categories.map((category) => ({
              label: category.name,
              value: category.id,
            }))}
            value={props.state.categoryId}
          />
        </Field>
      </PanelBlock>

      <PanelBlock title="元数据">
        <TextInput
          controlClassName="h-9 focus:border-neutral-400"
          label="标签"
          onChange={(value) => props.updateField('tags', value)}
          placeholder="用逗号分隔"
          value={props.state.tags}
        />
        <TextArea
          controlClassName="min-h-24 focus:border-neutral-400"
          label="摘要"
          onChange={(value) => props.updateField('summary', value)}
          value={props.state.summary}
        />
        <Switch
          checked={props.state.copyright}
          label="版权声明"
          onCheckedChange={(checked) => props.updateField('copyright', checked)}
        />
      </PanelBlock>
    </>
  )
}

function NoteFields(props: {
  state: WriteFormState
  topics: TopicModel[]
  updateField: <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => void
}) {
  return (
    <PanelBlock title="手记属性">
      <Field label="专栏">
        <SelectField
          aria-label="专栏"
          onValueChange={(topicId) => props.updateField('topicId', topicId)}
          options={[
            { label: '无专栏', value: '' },
            ...props.topics.map((topic) => ({
              label: topic.name,
              value: topic.id,
            })),
          ]}
          value={props.state.topicId}
        />
      </Field>
    </PanelBlock>
  )
}

function PageFields(props: {
  state: WriteFormState
  updateField: <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => void
}) {
  return (
    <PanelBlock title="页面属性">
      <TextInput
        controlClassName="h-9 focus:border-neutral-400"
        label="副标题"
        onChange={(value) => props.updateField('subtitle', value)}
        value={props.state.subtitle}
      />
      <TextInput
        controlClassName="h-9 focus:border-neutral-400"
        inputMode="numeric"
        label="排序"
        onChange={(value) => props.updateField('order', value)}
        value={props.state.order}
      />
    </PanelBlock>
  )
}

function PanelBlock(props: { children: ReactNode; title: string }) {
  return (
    <section className="rounded border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
      <h3 className="mb-3 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
        {props.title}
      </h3>
      <div className="space-y-3">{props.children}</div>
    </section>
  )
}

function Field(props: {
  children: ReactNode
  label: string
  required?: boolean
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {props.label}
        {props.required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {props.children}
    </label>
  )
}

function PreviewPanel(props: { text: string }) {
  return (
    <section className="min-h-[34rem] rounded border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
      {props.text ? (
        <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-neutral-800 dark:text-neutral-200">
          {props.text}
        </pre>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          暂无正文。
        </p>
      )}
    </section>
  )
}

function WriteSkeleton() {
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="h-11 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        <div className="h-[34rem] animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="h-28 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900"
            key={index}
          />
        ))}
      </div>
    </div>
  )
}

type WriteModel = NoteModel | PageModel | PostModel

const draftRefTypeByKind: Record<WriteKind, DraftRefType> = {
  note: DraftRefType.Note,
  page: DraftRefType.Page,
  post: DraftRefType.Post,
}

function getWriteDetail(kind: WriteKind, id: string): Promise<WriteModel> {
  if (kind === 'post') return getPostById(id)
  if (kind === 'note') return getNoteById(id, { single: true })
  return getPageById(id)
}

function fromModel(kind: WriteKind, model: WriteModel) {
  if (kind === 'post') {
    const post = model as PostModel
    return {
      ...emptyState,
      categoryId: post.categoryId,
      content: post.content ?? '',
      contentFormat: post.contentFormat ?? 'markdown',
      copyright: post.copyright,
      isPublished: post.isPublished ?? true,
      slug: post.slug,
      summary: post.summary ?? '',
      tags: post.tags.join(', '),
      text: post.content || post.text || '',
      title: post.title,
    }
  }

  if (kind === 'note') {
    const note = model as NoteModel
    return {
      ...emptyState,
      content: note.content ?? '',
      contentFormat: note.contentFormat ?? 'markdown',
      isPublished: note.isPublished,
      slug: note.slug ?? '',
      text: note.content || note.text || '',
      title: note.title,
      topicId: note.topicId ?? '',
    }
  }

  const page = model as PageModel
  return {
    ...emptyState,
    content: page.content ?? '',
    contentFormat: page.contentFormat ?? 'markdown',
    isPublished: true,
    order: typeof page.order === 'number' ? String(page.order) : '',
    slug: page.slug,
    subtitle: page.subtitle ?? '',
    text: page.content || page.text || '',
    title: page.title,
  }
}

function fromDraft(
  kind: WriteKind,
  draft: DraftModel,
  previous: WriteFormState,
): WriteFormState {
  const specific = draft.typeSpecificData ?? {}
  const base = {
    ...previous,
    content: draft.content ?? '',
    contentFormat: draft.contentFormat ?? 'markdown',
    text: draft.text ?? '',
    title: draft.title ?? '',
  }

  if (kind === 'post') {
    return {
      ...base,
      categoryId:
        typeof specific.categoryId === 'string'
          ? specific.categoryId
          : previous.categoryId,
      copyright:
        typeof specific.copyright === 'boolean'
          ? specific.copyright
          : previous.copyright,
      isPublished:
        typeof specific.isPublished === 'boolean'
          ? specific.isPublished
          : previous.isPublished,
      slug: typeof specific.slug === 'string' ? specific.slug : previous.slug,
      summary:
        typeof specific.summary === 'string'
          ? specific.summary
          : previous.summary,
      tags: Array.isArray(specific.tags)
        ? specific.tags.map((tag) => String(tag)).join(', ')
        : previous.tags,
    }
  }

  if (kind === 'note') {
    return {
      ...base,
      isPublished:
        typeof specific.isPublished === 'boolean'
          ? specific.isPublished
          : previous.isPublished,
      slug: typeof specific.slug === 'string' ? specific.slug : previous.slug,
      topicId:
        typeof specific.topicId === 'string'
          ? specific.topicId
          : previous.topicId,
    }
  }

  return {
    ...base,
    order:
      typeof specific.order === 'number'
        ? String(specific.order)
        : previous.order,
    slug: typeof specific.slug === 'string' ? specific.slug : previous.slug,
    subtitle:
      typeof specific.subtitle === 'string'
        ? specific.subtitle
        : previous.subtitle,
  }
}

function saveWrite(
  kind: WriteKind,
  id: string,
  state: WriteFormState,
): Promise<WriteModel> {
  if (kind === 'post') {
    const data = {
      categoryId: state.categoryId,
      content: state.text,
      contentFormat: state.contentFormat,
      copyright: state.copyright,
      isPublished: state.isPublished,
      slug: state.slug,
      summary: state.summary || null,
      tags: state.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      text: state.text,
      title: state.title,
    }

    if (state.contentFormat === 'lexical') {
      data.content = state.content
    }

    return id ? updatePost(id, data) : createPost(data)
  }

  if (kind === 'note') {
    const data = {
      content: state.contentFormat === 'lexical' ? state.content : state.text,
      contentFormat: state.contentFormat,
      isPublished: state.isPublished,
      slug: state.slug || undefined,
      text: state.text,
      title: state.title,
      topicId: state.topicId || null,
    }

    return id ? updateNote(id, data) : createNote(data)
  }

  const data = {
    content: state.contentFormat === 'lexical' ? state.content : state.text,
    contentFormat: state.contentFormat,
    order: state.order ? Number(state.order) : undefined,
    slug: state.slug,
    subtitle: state.subtitle,
    text: state.text,
    title: state.title,
  }

  return id ? updatePage(id, data) : createPage(data)
}

function toDraftData(
  kind: WriteKind,
  state: WriteFormState,
  refId?: string,
): CreateDraftData {
  const base = {
    content: state.contentFormat === 'lexical' ? state.content : state.text,
    contentFormat: state.contentFormat,
    refId,
    refType: draftRefTypeByKind[kind],
    text: state.text,
    title: state.title,
  } satisfies CreateDraftData

  if (kind === 'post') {
    return {
      ...base,
      typeSpecificData: {
        categoryId: state.categoryId,
        copyright: state.copyright,
        isPublished: state.isPublished,
        slug: state.slug,
        summary: state.summary || null,
        tags: state.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      },
    }
  }

  if (kind === 'note') {
    return {
      ...base,
      typeSpecificData: {
        isPublished: state.isPublished,
        slug: state.slug,
        topicId: state.topicId || null,
      },
    }
  }

  return {
    ...base,
    typeSpecificData: {
      order: state.order ? Number(state.order) : undefined,
      slug: state.slug,
      subtitle: state.subtitle || null,
    },
  }
}

function RichWriteSurface(props: {
  content: string
  kind: WriteKind
  onContentChange: (content: string) => void
  onTextChange: (text: string) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<RichEditorHandle | null>(null)
  const initialValueRef = useRef(parseSerializedEditorState(props.content))
  const latestCallbacks = useRef({
    onContentChange: props.onContentChange,
    onTextChange: props.onTextChange,
  })

  latestCallbacks.current = {
    onContentChange: props.onContentChange,
    onTextChange: props.onTextChange,
  }

  useEffect(() => {
    let disposed = false

    const mount = async () => {
      if (!containerRef.current) return
      const { mountRichEditor } = await import('@mx-admin/rich-react')
      if (disposed || !containerRef.current) return

      const options: MountRichEditorOptions = {
        apiUrl: API_URL,
        autoFocus: false,
        className:
          'min-h-[34rem] rounded border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950',
        contentClassName: 'min-h-[30rem] px-4 py-3',
        debounceMs: 250,
        editorStyle: { maxWidth: '100%' },
        imageUpload: async (file) => {
          const result = await uploadFile(file, 'image')
          return { src: result.url }
        },
        initialValue: initialValueRef.current,
        onChange: (value) => {
          latestCallbacks.current.onContentChange(JSON.stringify(value))
        },
        onTextChange: (text) => {
          latestCallbacks.current.onTextChange(text)
        },
        placeholder: '输入正文...',
        saveExcalidrawSnapshot,
        theme: getColorScheme(),
        variant: props.kind === 'note' ? 'note' : 'article',
      }

      editorRef.current = mountRichEditor(containerRef.current, options)
    }

    void mount()

    return () => {
      disposed = true
      editorRef.current?.unmount()
      editorRef.current = null
    }
  }, [props.kind])

  return <div ref={containerRef} />
}

function parseSerializedEditorState(
  content: string,
): MountRichEditorOptions['initialValue'] {
  if (!content.trim()) return undefined

  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && 'root' in parsed) {
      return parsed as MountRichEditorOptions['initialValue']
    }
  } catch {
    return undefined
  }

  return undefined
}

async function saveExcalidrawSnapshot(snapshot: object, existingRef?: string) {
  const name = existingRef
    ? `${existingRef.replace(/[^\w.-]/g, '-')}.json`
    : `excalidraw-${crypto.randomUUID()}.json`
  const file = new File([JSON.stringify(snapshot)], name, {
    type: 'application/json',
  })
  const result = await uploadFile(file, 'file')

  return result.url
}

function getColorScheme(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(date)
}

function validateState(
  kind: WriteKind,
  state: WriteFormState,
  categories: CategoryModel[],
) {
  if (!state.title.trim()) return '请输入标题'
  if (!state.text.trim()) return '请输入正文'
  if (kind !== 'note' && !state.slug.trim()) return '请输入 Slug'
  if (kind === 'post' && !state.categoryId) {
    return categories.length > 0 ? '请选择分类' : '请先创建分类'
  }
  if (kind === 'page' && state.order && Number.isNaN(Number(state.order))) {
    return '排序必须是数字'
  }

  return null
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
