import { Popover } from '@base-ui/react/popover'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftRight,
  BookOpen,
  Bot,
  Braces,
  Bug,
  Check,
  Clock,
  Copy,
  File as FileIcon,
  FileText,
  Hash,
  History,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react'
import {
  FormEvent,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  useBeforeUnload,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router'
import { load } from 'js-yaml'
import { toast } from 'sonner'
import type {
  AgentOperation,
  AgentStore,
  AgentStoreSlice,
  ChatBubble,
  DiffState,
  LLMProvider,
  ReviewBatch,
  ReviewState,
  ToolCallGroupItem,
  TransportAdapter,
} from '@haklex/rich-agent-core'
import type { CreateDraftData } from '~/api/drafts'
import type { AgentSessionMeta } from '~/hooks/use-agent-session-manager'
import type { Amap, AMapSearch } from '~/models/amap'
import type { Image as ImageModel } from '~/models/base'
import type { CategoryModel } from '~/models/category'
import type { DraftModel } from '~/models/draft'
import type { NoteModel } from '~/models/note'
import type { PageModel } from '~/models/page'
import type { PostModel } from '~/models/post'
import type { TopicModel } from '~/models/topic'
import type {
  RichEditorWithAgentProps,
  RichEditorWithAgentRef,
} from '~/rich-editor/components/RichEditorWithAgent'
import type { AgentLoopHandle } from '~/rich-editor/types'
import type { MetaFieldsSchema } from '~/rich-editor/utils/meta-tools'
import type { LexicalEditor, SerializedEditorState } from 'lexical'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { createAgentStore, createProvider } from '@haklex/rich-agent-core'

import { AiQueryType, getModels, writerGenerate } from '~/api/ai'
import { getCategories, getTags } from '~/api/categories'
import {
  createDraft,
  getDraftById,
  getDraftByRef,
  getDraftHistory,
  getDraftHistoryVersion,
  getNewDrafts,
  updateDraft,
} from '~/api/drafts'
import { uploadFile } from '~/api/files'
import { createNote, getNoteById, updateNote } from '~/api/notes'
import { createPage, getPageById, updatePage } from '~/api/pages'
import { createPost, getPostById, getPosts, updatePost } from '~/api/posts'
import { callBuiltInFunction } from '~/api/system'
import { getTopics } from '~/api/topics'
import { API_URL, WEB_URL } from '~/constants/env'
import { DraftHintBanner } from '~/features/write/components/DraftHintBanner'
import { MetaPresetSection } from '~/features/write/meta-presets'
import { useAgentSessionManager } from '~/hooks/use-agent-session-manager'
import { useLocalStorageState } from '~/hooks/use-local-storage-state'
import { DraftRefType } from '~/models/draft'
import {
  buildMetaSystemMessages,
  buildMetaTools,
} from '~/rich-editor/utils/meta-tools'
import { Button } from '~/ui/button'
import { cn } from '~/ui/cn'
import { CodeMirrorEditor, ImageDropZone } from '~/ui/codemirror'
import {
  AsidePanel,
  ContentLayout,
  ContentLayoutSlot,
} from '~/ui/content-layout'
import { DateTimePicker } from '~/ui/datetime-picker'
import { DraftStatusTag } from '~/ui/draft-status-tag'
import { Drawer } from '~/ui/drawer'
import { HeaderBackButton } from '~/ui/header-back-button'
import {
  APP_SHELL_HEADER_HEIGHT_CLASS,
  APP_SHELL_HEADER_HEIGHT_VALUE,
} from '~/ui/layout'
import { Modal, ModalHeader } from '~/ui/modal'
import { present } from '~/ui/modal-imperative'
import { Scroll } from '~/ui/scroll'
import { SelectField } from '~/ui/select'
import { Switch } from '~/ui/switch'
import { TextArea, TextInput } from '~/ui/text-field'
import { getDayOfYear } from '~/utils/time'

type WriteKind = 'note' | 'page' | 'post'
type ContentFormat = 'lexical' | 'markdown'
type NoteCoordinates = { latitude: number; longitude: number }

interface WriteFormState {
  bookmark: boolean
  categoryId: string
  content: string
  contentFormat: ContentFormat
  coordinatesLat: string
  coordinatesLng: string
  copyright: boolean
  isPublished: boolean
  images: NonNullable<DraftModel['images']>
  location: string
  meta: Record<string, unknown>
  mood: string
  order: string
  password: string
  passwordProtected: boolean
  pin: boolean
  pinOrder: string
  publicAt: string
  relatedId: string
  slug: string
  subtitle: string
  summary: string
  tags: string
  text: string
  title: string
  topicId: string
  weather: string
}

const emptyState: WriteFormState = {
  bookmark: false,
  categoryId: '',
  content: '',
  contentFormat: 'markdown',
  coordinatesLat: '',
  coordinatesLng: '',
  copyright: true,
  isPublished: true,
  images: [],
  location: '',
  meta: {},
  mood: '',
  order: '',
  password: '',
  passwordProtected: false,
  pin: false,
  pinOrder: '1',
  publicAt: '',
  relatedId: '',
  slug: '',
  subtitle: '',
  summary: '',
  tags: '',
  text: '',
  title: '',
  topicId: '',
  weather: '',
}

const emptyCategories: CategoryModel[] = []
const emptyTopics: TopicModel[] = []
const PREFERRED_CONTENT_FORMAT_STORAGE_KEY = 'preferred-content-format'
const RichEditorWithAgent = lazy(() =>
  import('~/rich-editor/components/RichEditorWithAgent').then((module) => ({
    default: module.RichEditorWithAgent,
  })),
)
const MOOD_SET = [
  '开心',
  '伤心',
  '决心',
  '坚定',
  '痛恨',
  '生气',
  '悲哀',
  '痛苦',
  '可怕',
  '不快',
  '可恶',
  '担心',
  '绝望',
  '焦虑',
  '激动',
] as const
const WEATHER_SET = ['晴', '多云', '雨', '阴', '雪', '雷雨'] as const

const POST_META_SCHEMA: MetaFieldsSchema = {
  title: { description: '文章标题', type: 'string' },
  slug: {
    description: 'URL 路径片段，建议英文小写并使用连字符',
    example: 'my-first-post',
    type: 'string',
  },
  tags: { description: '文章标签列表', type: 'string[]' },
  summary: { description: '文章摘要，留空将自动生成', type: 'string' },
  copyright: { description: '是否在文末显示版权信息', type: 'boolean' },
  pin: { description: '是否置顶', type: 'boolean' },
  pinOrder: {
    description: '置顶顺序，数字越大越靠前；置顶关闭时为 0',
    type: 'number',
  },
  isPublished: {
    description: '是否发布（false 为草稿）',
    type: 'boolean',
  },
}

const NOTE_META_SCHEMA: MetaFieldsSchema = {
  title: { description: '日记标题', type: 'string' },
  slug: {
    description: 'URL 路径片段，可空（空则使用 nid 路径）',
    type: 'string',
  },
  mood: { description: '心情', type: 'string' },
  weather: { description: '天气', type: 'string' },
  bookmark: { description: '是否标记为回忆项', type: 'boolean' },
  location: { description: '位置文本（可空）', type: 'string' },
  isPublished: {
    description: '是否发布（false 为草稿）',
    type: 'boolean',
  },
}

const PAGE_META_SCHEMA: MetaFieldsSchema = {
  title: { description: '页面标题', type: 'string' },
  slug: {
    description: 'URL 路径片段，建议英文小写并使用连字符',
    example: 'about',
    type: 'string',
  },
  subtitle: { description: '副标题', type: 'string' },
  order: {
    description: '导航顺序，数字越小越靠前',
    type: 'number',
  },
}

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

const draftKindLabel: Record<WriteKind, string> = {
  note: '手记',
  page: '页面',
  post: '文章',
}

function getDraftKindLabel(kind: WriteKind) {
  return draftKindLabel[kind]
}

export function PostWritePageContent() {
  return <WritePage kind="post" />
}

export function NoteWritePageContent() {
  return <WritePage kind="note" />
}

export function PageWritePageContent() {
  return <WritePage kind="page" />
}

function WritePage(props: { kind: WriteKind }) {
  const config = kindConfig[props.kind]
  const Icon = config.icon
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const routeDraftId = searchParams.get('draftId') ?? ''
  const isEditing = Boolean(id)
  const [preferredContentFormat, setPreferredContentFormat] =
    useLocalStorageState<ContentFormat>(
      PREFERRED_CONTENT_FORMAT_STORAGE_KEY,
      'markdown',
    )
  const [state, setState] = useState<WriteFormState>(() => ({
    ...emptyState,
    contentFormat: preferredContentFormat,
  }))
  const [asidePanel, setAsidePanel] = useState<'agent' | 'meta' | null>(null)
  const agentVisible = asidePanel === 'agent'
  const metaPanelOpen = asidePanel === 'meta'
  const toggleAsidePanel = (panel: 'agent' | 'meta') =>
    setAsidePanel((current) => (current === panel ? null : panel))
  const [draftId, setDraftId] = useState('')
  const [pageParseDialogOpen, setPageParseDialogOpen] = useState(false)
  const [pageLexicalDebugOpen, setPageLexicalDebugOpen] = useState(false)
  const [draftListOpen, setDraftListOpen] = useState(false)
  const [draftListHintDismissed, setDraftListHintDismissed] = useState(false)
  const [recoveryHintDismissed, setRecoveryHintDismissed] = useState(false)
  const applyDraftRef = useRef<(draft: DraftModel) => void>(() => {})
  const appliedRouteDraftIdRef = useRef<string | null>(null)
  const acceptedRouteRef = useRef({ pathname: '', route: '' })
  const confirmedNavigationRouteRef = useRef('')
  const draftDirtyRef = useRef(false)
  const lastSavedDraftFingerprintRef = useRef('')
  const latestDraftFingerprintRef = useRef('')
  const [lastSavedFingerprint, setLastSavedFingerprint] = useState('')
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
  const tagsQuery = useQuery({
    enabled: props.kind === 'post',
    queryFn: getTags,
    queryKey: ['tags', 'list', 'write'],
  })
  const relatedPostsQuery = useQuery({
    enabled: props.kind === 'post',
    queryFn: () =>
      getPosts({
        page: 1,
        size: 100,
        sort_by: 'createdAt',
        sort_order: 'desc',
      }),
    queryKey: ['posts', 'related-options', 'write'],
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
  const routeDraftQuery = useQuery({
    enabled: Boolean(routeDraftId),
    queryFn: () => getDraftById(routeDraftId),
    queryKey: ['drafts', 'detail', routeDraftId],
  })
  const newDraftsQuery = useQuery({
    enabled: !isEditing,
    queryFn: () => getNewDrafts(draftRefType),
    queryKey: ['drafts', 'new', draftRefType],
  })

  const categories = categoriesQuery.data ?? emptyCategories
  const tags = tagsQuery.data ?? []
  const topics = topicsQuery.data?.data ?? emptyTopics
  const relatedPosts = relatedPostsQuery.data?.data ?? []
  const firstCategoryId = categories[0]?.id ?? ''
  const activeCategory =
    categories.find((category) => category.id === state.categoryId) ??
    categories[0]
  const availableDraft = useMemo(() => {
    if (refDraftQuery.data) return refDraftQuery.data

    return [...(newDraftsQuery.data ?? [])].sort(
      (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    )[0]
  }, [newDraftsQuery.data, refDraftQuery.data])
  const publishedContent = useMemo(
    () => (detailQuery.data ? getPublishedContent(detailQuery.data) : null),
    [detailQuery.data],
  )
  const defaultNoteTitle = useMemo(() => {
    if (props.kind === 'note' && detailQuery.data) {
      return getDefaultNoteTitle(
        new Date((detailQuery.data as NoteModel).createdAt),
      )
    }

    return getDefaultNoteTitle()
  }, [detailQuery.data, props.kind])
  const notePublicPath =
    props.kind === 'note'
      ? buildNotePublicPath(state, detailQuery.data as NoteModel | undefined)
      : ''
  const postPublicPath =
    props.kind === 'post' ? buildPostPublicPath(state, activeCategory) : ''
  const draftFingerprint = useMemo(
    () =>
      JSON.stringify(
        toDraftData(props.kind, state, isEditing ? id : undefined),
      ),
    [id, isEditing, props.kind, state],
  )
  const hasDraftAutosaveContent =
    state.title.trim().length > 0 ||
    state.text.trim().length > 0 ||
    state.content.trim().length > 0
  const canSwitchEditorType = !state.text.trim() && !state.content.trim()

  useEffect(() => {
    latestDraftFingerprintRef.current = draftFingerprint
  }, [draftFingerprint])

  const hasUnsavedDraftChanges = () =>
    draftDirtyRef.current &&
    hasDraftAutosaveContent &&
    latestDraftFingerprintRef.current !== lastSavedDraftFingerprintRef.current

  useBeforeUnload(
    (event) => {
      if (!hasUnsavedDraftChanges()) return
      event.preventDefault()
    },
    { capture: true },
  )

  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
        return
      if (!hasUnsavedDraftChanges()) return

      const target = event.target
      const anchor =
        target instanceof Element
          ? target.closest<HTMLAnchorElement>('a')
          : null
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      const nextRoute = getHashRouterRoute(anchor.href)
      if (!nextRoute) return
      const nextPathname = getRoutePathname(nextRoute)
      if (nextPathname === location.pathname) return

      if (window.confirm('当前内容尚未保存为草稿，确认离开？')) {
        confirmedNavigationRouteRef.current = nextRoute
        return
      }

      event.preventDefault()
      event.stopPropagation()
    }

    document.addEventListener('click', onClickCapture, true)
    return () => document.removeEventListener('click', onClickCapture, true)
  }, [hasDraftAutosaveContent, location.pathname])

  useEffect(() => {
    const currentRoute = `${location.pathname}${location.search}${location.hash}`
    const acceptedRoute = acceptedRouteRef.current

    if (!acceptedRoute.route) {
      acceptedRouteRef.current = {
        pathname: location.pathname,
        route: currentRoute,
      }
      return
    }

    if (acceptedRoute.route === currentRoute) return

    if (confirmedNavigationRouteRef.current === currentRoute) {
      confirmedNavigationRouteRef.current = ''
      acceptedRouteRef.current = {
        pathname: location.pathname,
        route: currentRoute,
      }
      return
    }

    if (
      acceptedRoute.pathname !== location.pathname &&
      hasUnsavedDraftChanges()
    ) {
      if (window.confirm('当前内容尚未保存为草稿，确认离开？')) {
        acceptedRouteRef.current = {
          pathname: location.pathname,
          route: currentRoute,
        }
      } else {
        navigate(acceptedRoute.route, { replace: true })
      }
      return
    }

    acceptedRouteRef.current = {
      pathname: location.pathname,
      route: currentRoute,
    }
  }, [location.hash, location.pathname, location.search, navigate])

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

    if (!routeDraftId) {
      setState(fromModel(props.kind, detailQuery.data))
    }
  }, [detailQuery.data, firstCategoryId, props.kind, routeDraftId])

  useEffect(() => {
    if (refDraftQuery.data && !draftId) {
      setDraftId(refDraftQuery.data.id)
    }
  }, [draftId, refDraftQuery.data])

  const recoveryHintDraft = useMemo(() => {
    const draft = refDraftQuery.data
    const published = detailQuery.data
    if (!isEditing || routeDraftId || !draft || !published) return null
    if (!isDraftNewerThanPublished(draft, published)) return null
    return draft
  }, [detailQuery.data, isEditing, refDraftQuery.data, routeDraftId])

  const openRecoveryDialog = (draft: DraftModel) => {
    if (!publishedContent) return
    const handle = present(
      DraftRecoveryDialog,
      {
        draft,
        publishedContent,
        onRecover: (recovered) => {
          applyDraftRef.current(recovered)
          setRecoveryHintDismissed(true)
          handle.dismiss()
        },
        onUsePublished: () => {
          draftDirtyRef.current = false
          lastSavedDraftFingerprintRef.current =
            latestDraftFingerprintRef.current
          setLastSavedFingerprint(latestDraftFingerprintRef.current)
          setRecoveryHintDismissed(true)
          handle.dismiss()
        },
      },
      {
        modalProps: {
          popupStyle: { height: 'min(78vh, 38rem)', width: 'min(92vw, 56rem)' },
        },
      },
    )
  }

  useEffect(() => {
    const draft = routeDraftQuery.data
    if (!draft || appliedRouteDraftIdRef.current === draft.id) return

    if (draft.refType !== draftRefType) {
      toast.error('草稿类型与当前写作页面不匹配')
      appliedRouteDraftIdRef.current = draft.id
      return
    }

    appliedRouteDraftIdRef.current = draft.id
    setDraftId(draft.id)
    setState((previous) => fromDraft(props.kind, draft, previous))

    if (draft.refId && !id) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('id', draft.refId)
      nextParams.set('draftId', draft.id)
      setSearchParams(nextParams, { replace: true })
    }
  }, [
    draftRefType,
    id,
    props.kind,
    routeDraftQuery.data,
    searchParams,
    setSearchParams,
  ])

  const saveMutation = useMutation<WriteModel>({
    mutationFn: () => saveWrite(props.kind, id, state, draftId || undefined),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '保存失败')),
    onSuccess: async (result) => {
      draftDirtyRef.current = false
      lastSavedDraftFingerprintRef.current = latestDraftFingerprintRef.current
      setLastSavedFingerprint(latestDraftFingerprintRef.current)
      toast.success(isEditing ? '已保存' : '已创建')
      await queryClient.invalidateQueries({ queryKey: [config.queryKey] })
      if (props.kind === 'page') {
        navigate(config.listPath)
        return
      }
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
      const isFirstDraftSave = !draftId
      setDraftId(draft.id)
      draftDirtyRef.current = false
      lastSavedDraftFingerprintRef.current = latestDraftFingerprintRef.current
      setLastSavedFingerprint(latestDraftFingerprintRef.current)
      if (isFirstDraftSave && searchParams.get('draftId') !== draft.id) {
        const nextParams = new URLSearchParams(searchParams)
        nextParams.set('draftId', draft.id)
        setSearchParams(nextParams, { replace: true })
      }
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
      draftDirtyRef.current = true
      setState((previous) => ({
        ...previous,
        slug: result.slug || previous.slug,
        title: result.title || previous.title,
      }))
      toast.success('AI 生成已应用')
    },
  })

  const validationError = useMemo(
    () => validateState(props.kind, state, categories, isEditing),
    [categories, isEditing, props.kind, state],
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
    if (!draftDirtyRef.current) return
    if (!hasDraftAutosaveContent) return
    if (draftFingerprint === lastSavedDraftFingerprintRef.current) return

    const timer = window.setTimeout(() => {
      if (!draftDirtyRef.current || draftMutationRef.current.isPending) return
      draftMutationRef.current.mutate()
    }, 10000)

    return () => window.clearTimeout(timer)
  }, [draftFingerprint, hasDraftAutosaveContent])

  const updateField = <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => {
    draftDirtyRef.current = true
    setState((previous) => ({ ...previous, [key]: value }))
  }

  const updateContentFormat = (format: ContentFormat) => {
    setPreferredContentFormat(format)
    updateField('contentFormat', format)
  }

  const getAgentMetaFields = () => getWriteAgentMetaFields(props.kind, state)

  const applyAgentMetaUpdates = (updates: Record<string, unknown>) => {
    draftDirtyRef.current = true
    setState((previous) =>
      applyWriteAgentMetaUpdates(props.kind, previous, updates),
    )
  }

  const applyDraft = (draft: DraftModel) => {
    draftDirtyRef.current = true
    setDraftId(draft.id)
    setState((previous) => fromDraft(props.kind, draft, previous))
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('draftId', draft.id)
    if (draft.refId) nextParams.set('id', draft.refId)
    setSearchParams(nextParams, { replace: true })
    toast.success('已套用草稿')
  }
  applyDraftRef.current = applyDraft

  const generateTitleOrSlug = () => {
    if (!state.title.trim() && !state.text.trim()) {
      toast.error('请输入标题或正文后再生成')
      return
    }

    writerGenerateMutation.mutate()
  }

  const saveDraftNow = () => {
    if (!hasDraftAutosaveContent) {
      toast.error('请输入内容后再保存草稿')
      return
    }
    if (draftMutation.isPending) return

    draftMutation.mutate()
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        saveDraftNow()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [saveDraftNow])

  const copyPageUrl = () => {
    if (!state.slug.trim()) return

    void navigator.clipboard
      .writeText(`${WEB_URL}/${state.slug.trim()}`)
      .then(() => toast.success('链接已复制'))
      .catch(() => toast.error('复制失败'))
  }

  const latestDraft = draftMutation.data ?? availableDraft
  const draftListHintCount =
    !isEditing && !routeDraftId ? (newDraftsQuery.data?.length ?? 0) : 0
  const showDraftListHint =
    draftListHintCount > 0 && !draftListHintDismissed && !draftListOpen
  const showRecoveryHint = Boolean(
    recoveryHintDraft && publishedContent && !recoveryHintDismissed,
  )
  const draftKindText = getDraftKindLabel(props.kind)
  const isDirty =
    hasDraftAutosaveContent && draftFingerprint !== lastSavedFingerprint
  const metaStatus = computeMetaStatus({
    isDirty,
    isEditing,
    isPendingDraftSave: draftMutation.isPending,
    latestDraft,
    publishedUpdatedAt: detailQuery.data
      ? getPublishedContent(detailQuery.data).updatedAt
      : undefined,
  })

  const slugPathPrefix =
    props.kind === 'post'
      ? `/posts/${activeCategory?.slug ?? ''}/`
      : props.kind === 'page'
        ? '/'
        : ''
  const slugDisplayPath = state.slug.trim()
    ? `${slugPathPrefix}${state.slug.trim()}`
    : ''
  const aiButtonVisible =
    state.text.trim().length > 0 &&
    (props.kind === 'note' ||
      (props.kind === 'post' && (!state.title.trim() || !state.slug.trim())) ||
      (props.kind === 'page' && !state.slug.trim()))

  const titlePlaceholder =
    props.kind === 'note' ? defaultNoteTitle : '输入标题...'

  const subtitleNode: ReactNode =
    props.kind === 'page' ? (
      <input
        className="outline-hidden mt-1 w-full border-0 bg-transparent px-0 text-base text-neutral-500 placeholder:text-neutral-300 dark:text-neutral-400 dark:placeholder:text-neutral-700"
        onChange={(event) => updateField('subtitle', event.target.value)}
        placeholder="副标题…"
        value={state.subtitle}
      />
    ) : null

  return (
    <form className="flex h-full min-h-0 flex-col" onSubmit={onSubmit}>
      <section
        className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950"
        style={
          {
            '--app-shell-header-height': APP_SHELL_HEADER_HEIGHT_VALUE,
          } as CSSProperties
        }
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
            APP_SHELL_HEADER_HEIGHT_CLASS,
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <HeaderBackButton label="返回列表" to={config.listPath} />
            <h2 className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-neutral-950 dark:text-neutral-50">
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">
                {props.kind === 'page'
                  ? isEditing
                    ? '修改页面'
                    : '新建页面'
                  : config.title}
              </span>
            </h2>
            <DraftStatusTag
              className="hidden md:inline-flex"
              draft={draftMutation.data ?? availableDraft}
              isSaving={draftMutation.isPending}
            />
          </div>
          {props.kind === 'page' ? (
            <div className="flex shrink-0 items-center gap-1.5">
              {state.contentFormat === 'markdown' ? (
                <WriteHeaderIconButton
                  onClick={() => setPageParseDialogOpen(true)}
                  title="解析 Markdown"
                  type="button"
                >
                  <Hash aria-hidden="true" className="size-4" />
                </WriteHeaderIconButton>
              ) : (
                <WriteHeaderIconButton
                  onClick={() => setPageLexicalDebugOpen(true)}
                  title="Lexical Debug"
                  type="button"
                >
                  <Bug aria-hidden="true" className="size-4" />
                </WriteHeaderIconButton>
              )}
              <WriteHeaderIconButton
                onClick={() => toggleAsidePanel('meta')}
                title={metaPanelOpen ? '隐藏页面设置' : '页面设置'}
                type="button"
                variant={metaPanelOpen ? 'primary' : 'default'}
              >
                <SlidersHorizontal aria-hidden="true" className="size-4" />
              </WriteHeaderIconButton>
              <WriteHeaderIconButton
                disabled={saveMutation.isPending || detailQuery.isLoading}
                title="发布"
                type="submit"
                variant="primary"
              >
                {saveMutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Send aria-hidden="true" className="size-4" />
                )}
              </WriteHeaderIconButton>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1.5">
              <WriteHeaderIconButton
                disabled={state.contentFormat !== 'lexical'}
                onClick={() => toggleAsidePanel('agent')}
                title={agentVisible ? '隐藏 AI 助手' : 'AI 助手'}
                type="button"
                variant={agentVisible ? 'primary' : 'default'}
              >
                <Bot aria-hidden="true" className="size-4" />
              </WriteHeaderIconButton>
              <WriteHeaderIconButton
                onClick={() => toggleAsidePanel('meta')}
                title={
                  metaPanelOpen
                    ? props.kind === 'post'
                      ? '隐藏文章设置'
                      : '隐藏手记设置'
                    : props.kind === 'post'
                      ? '文章设置'
                      : '手记设置'
                }
                type="button"
                variant={metaPanelOpen ? 'primary' : 'default'}
              >
                <SlidersHorizontal aria-hidden="true" className="size-4" />
              </WriteHeaderIconButton>
              <WriteHeaderIconButton
                disabled={saveMutation.isPending || detailQuery.isLoading}
                title="发布"
                type="submit"
                variant="primary"
              >
                {saveMutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Send aria-hidden="true" className="size-4" />
                )}
              </WriteHeaderIconButton>
            </div>
          )}
        </div>

        {showDraftListHint ? (
          <DraftHintBanner
            actionLabel="查看列表"
            message={`发现 ${draftListHintCount} 条未完成${draftKindText}草稿`}
            onAction={() => setDraftListOpen(true)}
            onDismiss={() => setDraftListHintDismissed(true)}
            variant="list"
          />
        ) : null}
        {showRecoveryHint && recoveryHintDraft ? (
          <DraftHintBanner
            actionLabel="对比并恢复"
            message={`本${draftKindText}有较已发布更新之草稿（v${recoveryHintDraft.version}）`}
            onAction={() => openRecoveryDialog(recoveryHintDraft)}
            onDismiss={() => setRecoveryHintDismissed(true)}
            variant="recovery"
          />
        ) : null}

        <ContentLayout
          className="min-h-0 flex-1"
          mainClassName="flex flex-col"
          onCloseAside={() => setAsidePanel(null)}
          open={asidePanel !== null && !detailQuery.isLoading}
        >
          {detailQuery.isLoading ? (
            <div className="min-h-0 flex-1">
              <WriteSkeleton kind={props.kind} />
            </div>
          ) : (
            <Scroll
              className="min-h-0 flex-1"
              innerClassName="min-h-full bg-white dark:bg-neutral-950"
            >
              <main className="flex min-h-full min-w-0 flex-col bg-white dark:bg-neutral-950">
                <div className="mx-auto w-full max-w-5xl shrink-0 px-3 pt-8">
                  <EditorMetaStrip
                    aiButtonPending={writerGenerateMutation.isPending}
                    aiButtonVisible={aiButtonVisible}
                    canSwitchFormat={canSwitchEditorType}
                    format={state.contentFormat}
                    onAiGenerate={generateTitleOrSlug}
                    onToggleFormat={() =>
                      updateContentFormat(
                        state.contentFormat === 'lexical'
                          ? 'markdown'
                          : 'lexical',
                      )
                    }
                    status={metaStatus.status}
                    statusText={metaStatus.text}
                  />
                  <EditorTitleArea
                    autoFocus={!isEditing}
                    copyPageUrl={
                      props.kind === 'page' ? copyPageUrl : undefined
                    }
                    displayPath={slugDisplayPath}
                    onSlugChange={(value) => updateField('slug', value)}
                    onTitleChange={(value) => updateField('title', value)}
                    placeholder={titlePlaceholder}
                    required={props.kind !== 'note'}
                    showSlugPill={props.kind !== 'note'}
                    slug={state.slug}
                    slugPlaceholder={
                      props.kind === 'page' ? 'slug' : 'slug-of-this-post'
                    }
                    slugPrefix={slugPathPrefix}
                    subtitle={subtitleNode}
                    title={state.title}
                  />
                  <hr className="my-4 border-0 border-t border-neutral-100 dark:border-neutral-900" />
                </div>

                <div className="flex min-h-0 flex-1 flex-col pb-[200px]">
                  <div className="mx-auto w-full max-w-5xl px-3">
                    {state.contentFormat === 'lexical' ? (
                      <RichWriteSurface
                        agentVisible={agentVisible}
                        autoFocus={isEditing}
                        content={state.content}
                        contentClassName="min-h-120 px-0 py-3"
                        kind={props.kind}
                        key={`${props.kind}:${id || 'new'}:${state.contentFormat}`}
                        getMetaFields={getAgentMetaFields}
                        metaFieldsSchema={getWriteAgentMetaSchema(props.kind)}
                        onContentChange={(content) =>
                          updateField('content', content)
                        }
                        onMetaFieldsUpdate={applyAgentMetaUpdates}
                        onTextChange={(text) => updateField('text', text)}
                        refId={isEditing ? id : undefined}
                        surfaceClassName="min-h-136 rounded-none border-0 bg-transparent dark:bg-transparent"
                        surfaceStyle={
                          {
                            minHeight: '34rem',
                            '--rc-max-width': 'none',
                          } as CSSProperties
                        }
                      />
                    ) : (
                      <>
                        <CodeMirrorEditor
                          autoFocus={isEditing}
                          className="min-h-136 rounded-none border-0 bg-transparent px-0 py-6"
                          onChange={(value) => updateField('text', value)}
                          style={{ minHeight: '34rem' }}
                          text={state.text}
                        />
                        <ImageDropZone />
                      </>
                    )}
                  </div>
                </div>
              </main>
            </Scroll>
          )}
          <ContentLayoutSlot active={metaPanelOpen} id="meta">
            {props.kind === 'page' ? (
              <PageSettingsPanel state={state} updateField={updateField} />
            ) : (
              <ContentSettingsPanel
                availableDraft={availableDraft}
                draftMutationData={draftMutation.data}
                draftMutationPending={draftMutation.isPending}
                kind={props.kind}
                noteFields={
                  props.kind === 'note' ? (
                    <NoteFields
                      state={state}
                      topics={topics}
                      updateField={updateField}
                    />
                  ) : null
                }
                onApplyDraft={applyDraft}
                onGenerateTitleOrSlug={generateTitleOrSlug}
                onSaveDraft={saveDraftNow}
                postFields={
                  props.kind === 'post' ? (
                    <PostFields
                      categories={categories}
                      currentPostId={id}
                      relatedPosts={relatedPosts}
                      state={state}
                      tags={tags}
                      updateField={updateField}
                    />
                  ) : null
                }
                publicPath={
                  props.kind === 'note'
                    ? notePublicPath
                      ? `${WEB_URL}${notePublicPath}`
                      : '留空则使用手记 nid 路径。'
                    : postPublicPath
                      ? `${WEB_URL}${postPublicPath}`
                      : '有标题时生成 Slug；无标题时根据正文生成标题与 Slug。'
                }
                saveResultId={saveMutation.data?.id}
                state={state}
                updateField={updateField}
                writerGeneratePending={writerGenerateMutation.isPending}
              />
            )}
          </ContentLayoutSlot>
        </ContentLayout>
      </section>

      {props.kind === 'page' ? (
        <PageParseMarkdownDialog
          onApply={(parsed) => {
            setState((previous) => applyParsedPageMarkdown(previous, parsed))
            setPageParseDialogOpen(false)
            toast.success('Markdown 已解析')
          }}
          onClose={() => setPageParseDialogOpen(false)}
          open={pageParseDialogOpen}
        />
      ) : null}
      {props.kind === 'page' ? (
        <PageLexicalDebugDialog
          content={state.content}
          onClose={() => setPageLexicalDebugOpen(false)}
          open={pageLexicalDebugOpen}
        />
      ) : null}
      <DraftListDialog
        draftLabel={getDraftKindLabel(props.kind)}
        drafts={newDraftsQuery.data ?? []}
        onClose={() => {
          setDraftListOpen(false)
          setDraftListHintDismissed(true)
        }}
        onCreate={() => {
          setDraftListOpen(false)
          setDraftListHintDismissed(true)
        }}
        onSelect={(draft) => {
          applyDraft(draft)
          setDraftListOpen(false)
          setDraftListHintDismissed(true)
        }}
        open={draftListOpen}
      />
    </form>
  )
}

function ContentSettingsPanel(props: {
  availableDraft?: DraftModel
  draftMutationData?: DraftModel
  draftMutationPending: boolean
  kind: Exclude<WriteKind, 'page'>
  noteFields: ReactNode
  onApplyDraft: (draft: DraftModel) => void
  onGenerateTitleOrSlug: () => void
  onSaveDraft: () => void
  postFields: ReactNode
  publicPath: string
  saveResultId?: string
  state: WriteFormState
  updateField: <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => void
  writerGeneratePending: boolean
}) {
  return (
    <AsidePanel>
      <Scroll
        className="min-h-0 flex-1"
        innerClassName="grid grid-cols-[minmax(0,1fr)] gap-4 p-4"
      >
        <PanelBlock title="发布">
          <Switch
            checked={props.state.isPublished}
            label="发布状态"
            onCheckedChange={(checked) =>
              props.updateField('isPublished', checked)
            }
          />
          {props.saveResultId ? (
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <Check aria-hidden="true" className="size-4" />
              已保存 ID: {props.saveResultId}
            </div>
          ) : null}
        </PanelBlock>

        <PanelBlock title="草稿">
          <div className="space-y-3 text-sm">
            {props.availableDraft ? (
              <div className="border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <History aria-hidden="true" className="size-4" />
                  <span>
                    版本 {props.availableDraft.version} ·{' '}
                    {formatDateTime(props.availableDraft.updatedAt)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-neutral-800 dark:text-neutral-200">
                  {props.availableDraft.title || '未命名草稿'}
                </p>
                <Button
                  className="mt-3 w-full"
                  onClick={() => props.onApplyDraft(props.availableDraft!)}
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
              disabled={props.draftMutationPending}
              onClick={props.onSaveDraft}
              type="button"
              variant="subtle"
            >
              {props.draftMutationPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Clock aria-hidden="true" className="size-4" />
              )}
              保存草稿
            </Button>
            {props.draftMutationData ? (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                最近保存：
                {formatDateTime(props.draftMutationData.updatedAt)}
              </p>
            ) : null}
          </div>
        </PanelBlock>

        <PanelBlock title="路径">
          <TextInput
            controlClassName="h-9 font-mono focus:border-neutral-400"
            label="Slug"
            onChange={(value) => props.updateField('slug', value)}
            required={props.kind !== 'note'}
            value={props.state.slug}
          />
          <Button
            className="w-full"
            disabled={props.writerGeneratePending}
            onClick={props.onGenerateTitleOrSlug}
            type="button"
            variant="subtle"
          >
            {props.writerGeneratePending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <WandSparkles aria-hidden="true" className="size-4" />
            )}
            {props.state.title.trim() ? '生成 Slug' : '生成标题与 Slug'}
          </Button>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {props.publicPath}
          </p>
        </PanelBlock>

        {props.postFields}
        {props.noteFields}
        <MediaAndMetaFields
          kind={props.kind}
          state={props.state}
          updateField={props.updateField}
        />
      </Scroll>
    </AsidePanel>
  )
}

function DraftListDialog(props: {
  draftLabel: string
  drafts: DraftModel[]
  onClose: () => void
  onCreate: () => void
  onSelect: (draft: DraftModel) => void
  open: boolean
}) {
  const [selectedDraftId, setSelectedDraftId] = useState('')
  const selectedDraft =
    props.drafts.find((draft) => draft.id === selectedDraftId) ??
    props.drafts[0]

  useEffect(() => {
    if (!props.open) return
    setSelectedDraftId(props.drafts[0]?.id ?? '')
  }, [props.drafts, props.open])

  const continueDraft = () => {
    if (!selectedDraft) return
    props.onSelect(selectedDraft)
  }

  return (
    <Modal
      className="max-h-[88vh]"
      onClose={props.onClose}
      open={props.open}
      popupStyle={{ height: 'min(82vh, 38rem)', width: 'min(92vw, 56rem)' }}
    >
      <ModalHeader icon={History} title="发现未完成的草稿" />

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[15rem_minmax(0,1fr)]">
        <Scroll
          className="min-h-0 border-b border-neutral-200 md:border-b-0 md:border-r dark:border-neutral-800"
          innerClassName="divide-y divide-neutral-100 dark:divide-neutral-900"
        >
          {props.drafts.map((draft) => (
            <button
              className={cn(
                'flex w-full min-w-0 items-start gap-3 px-4 py-3 text-left transition-colors',
                selectedDraft?.id === draft.id
                  ? 'bg-neutral-100 dark:bg-neutral-900'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60',
              )}
              key={draft.id}
              onClick={() => setSelectedDraftId(draft.id)}
              type="button"
            >
              <span
                className={cn(
                  'mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border',
                  selectedDraft?.id === draft.id
                    ? 'border-neutral-900 bg-neutral-900 dark:border-neutral-100 dark:bg-neutral-100'
                    : 'border-neutral-300 dark:border-neutral-700',
                )}
                aria-hidden="true"
              >
                {selectedDraft?.id === draft.id ? (
                  <span className="size-1.5 rounded-full bg-white dark:bg-neutral-950" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
                  {draft.title || '无标题'}
                </span>
                <span className="mt-1 block text-xs text-neutral-500 dark:text-neutral-400">
                  v{draft.version} · {draft.text.length} 字
                </span>
                <span className="mt-0.5 block text-xs text-neutral-400 dark:text-neutral-500">
                  {formatDateTime(draft.updatedAt)}
                </span>
              </span>
            </button>
          ))}
        </Scroll>

        <Scroll className="min-h-0" innerClassName="p-4">
          {selectedDraft ? (
            <div className="min-h-full border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
              <div className="mb-3 flex min-w-0 items-center justify-between gap-3 border-b border-neutral-200 pb-3 dark:border-neutral-800">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
                    {selectedDraft.title || '无标题'}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {selectedDraft.contentFormat === 'lexical'
                      ? 'Lexical'
                      : 'Markdown'}{' '}
                    · 更新于 {formatDateTime(selectedDraft.updatedAt)}
                  </p>
                </div>
                <FileText
                  aria-hidden="true"
                  className="size-4 shrink-0 text-neutral-400"
                />
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-5 text-neutral-800 dark:text-neutral-200">
                {selectedDraft.text || '草稿正文为空。'}
              </pre>
            </div>
          ) : (
            <div className="flex h-full min-h-60 items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
              选择一个草稿查看内容
            </div>
          )}
        </Scroll>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <Button onClick={props.onCreate} type="button" variant="subtle">
          创建新{props.draftLabel}
        </Button>
        <Button disabled={!selectedDraft} onClick={continueDraft} type="button">
          继续编辑选中的草稿
        </Button>
      </div>
    </Modal>
  )
}

interface PublishedWriteContent {
  content?: string
  contentFormat?: ContentFormat
  text: string
  title: string
  updatedAt: string
}

function DraftRecoveryDialog(props: {
  draft: DraftModel
  onRecover: (draft: DraftModel) => void
  onUsePublished: () => void
  publishedContent: PublishedWriteContent
}) {
  const [selectedVersion, setSelectedVersion] = useState<
    'current' | 'published' | number
  >('current')
  const [selectedDraft, setSelectedDraft] = useState<DraftModel>(props.draft)
  const historyQuery = useQuery({
    enabled: Boolean(props.draft.id),
    queryFn: () => getDraftHistory(props.draft.id),
    queryKey: ['drafts', 'recovery-history', props.draft.id],
  })
  const selectedVersionQuery = useQuery({
    enabled:
      typeof selectedVersion === 'number' &&
      selectedVersion !== props.draft.version,
    queryFn: () =>
      getDraftHistoryVersion(props.draft.id, selectedVersion as number),
    queryKey: ['drafts', 'recovery-version', props.draft.id, selectedVersion],
  })
  const versionItems = useMemo(
    () => buildRecoveryVersionItems(props.draft, historyQuery.data),
    [historyQuery.data, props.draft],
  )
  const selectedContent =
    selectedVersion === 'published'
      ? props.publishedContent
      : selectedVersion === 'current' || selectedVersion === props.draft.version
        ? props.draft
        : (selectedVersionQuery.data ?? selectedDraft)
  const diffStats = getDraftDiffStats(props.publishedContent, selectedContent)

  useEffect(() => {
    setSelectedVersion('current')
    setSelectedDraft(props.draft)
  }, [props.draft])

  useEffect(() => {
    if (selectedVersionQuery.data) {
      setSelectedDraft(selectedVersionQuery.data)
    }
  }, [selectedVersionQuery.data])

  const recoverSelected = () => {
    if (selectedVersion === 'published') {
      props.onUsePublished()
      return
    }

    props.onRecover(
      selectedVersion === 'current' || selectedVersion === props.draft.version
        ? props.draft
        : selectedDraft,
    )
  }

  return (
    <>
      <ModalHeader
        className="h-auto py-3"
        subtitle={`当前草稿更新于 ${formatDateTime(props.draft.updatedAt)}，可与已发布内容对比后恢复。`}
        title="检测到未恢复的草稿"
      />

      <div
        className="grid min-h-0 flex-1"
        style={{ gridTemplateColumns: '16rem minmax(0, 1fr)' }}
      >
        <Scroll className="min-h-0 border-r border-neutral-200 dark:border-neutral-800">
          <button
            className={cn(
              'grid w-full gap-1 border-b border-neutral-100 px-4 py-3 text-left text-sm transition-colors dark:border-neutral-900',
              selectedVersion === 'current'
                ? 'bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50'
                : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900/60',
            )}
            onClick={() => {
              setSelectedVersion('current')
              setSelectedDraft(props.draft)
            }}
            type="button"
          >
            <span className="font-medium">当前草稿</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              v{props.draft.version} · {formatDateTime(props.draft.updatedAt)}
            </span>
          </button>

          {versionItems.map((item) => (
            <button
              className={cn(
                'grid w-full gap-1 border-b border-neutral-100 px-4 py-3 text-left text-sm transition-colors dark:border-neutral-900',
                selectedVersion === item.version
                  ? 'bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50'
                  : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900/60',
              )}
              key={item.version}
              onClick={() => setSelectedVersion(item.version)}
              type="button"
            >
              <span className="font-medium">历史版本 v{item.version}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatDateTime(item.savedAt)}
              </span>
            </button>
          ))}

          <button
            className={cn(
              'grid w-full gap-1 px-4 py-3 text-left text-sm transition-colors',
              selectedVersion === 'published'
                ? 'bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50'
                : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900/60',
            )}
            onClick={() => setSelectedVersion('published')}
            type="button"
          >
            <span className="font-medium">已发布版本</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatDateTime(props.publishedContent.updatedAt)}
            </span>
          </button>
        </Scroll>

        <main className="flex min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-2.5 text-xs dark:border-neutral-800">
            <div className="min-w-0 truncate text-neutral-500 dark:text-neutral-400">
              已发布 →{' '}
              {selectedVersion === 'published'
                ? '已发布版本'
                : selectedVersion === 'current'
                  ? '当前草稿'
                  : `历史版本 v${selectedVersion}`}
            </div>
            <div className="shrink-0 text-neutral-500 dark:text-neutral-400">
              {diffStats.isSame ? (
                '内容相同'
              ) : (
                <>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{diffStats.added}
                  </span>
                  <span> / </span>
                  <span className="text-red-600 dark:text-red-400">
                    -{diffStats.removed}
                  </span>
                  <span> 字</span>
                </>
              )}
            </div>
          </div>

          <Scroll
            className="min-h-0 flex-1"
            innerClassName="grid grid-cols-[minmax(0,1fr)] gap-3 p-4"
          >
            <div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                标题
              </div>
              <div className="mt-1 text-sm text-neutral-950 dark:text-neutral-50">
                {selectedContent.title || '无标题'}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                正文预览
              </div>
              <Scroll
                className="mt-2 border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60"
                orientation="both"
                viewportClassName="max-h-96"
              >
                <pre className="whitespace-pre-wrap p-3 text-xs leading-5 text-neutral-700 dark:text-neutral-200">
                  {selectedContent.text ||
                    selectedContent.content ||
                    '暂无正文'}
                </pre>
              </Scroll>
            </div>
          </Scroll>
        </main>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <Button onClick={props.onUsePublished} type="button" variant="subtle">
          使用已发布版本
        </Button>
        <Button
          disabled={
            selectedVersion === 'published' || selectedVersionQuery.isLoading
          }
          onClick={recoverSelected}
          type="button"
        >
          {selectedVersionQuery.isLoading ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <History aria-hidden="true" className="size-4" />
          )}
          恢复选中版本
        </Button>
      </div>
    </>
  )
}

function WriteHeaderIconButton(props: {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  title: string
  type: 'button' | 'submit'
  variant?: 'default' | 'primary'
}) {
  return (
    <button
      aria-label={props.title}
      className={cn(
        'focus-visible:outline-hidden inline-flex size-9 items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-900',
        props.variant === 'primary'
          ? 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
          : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100',
      )}
      disabled={props.disabled}
      onClick={props.onClick}
      title={props.title}
      type={props.type}
    >
      {props.children}
    </button>
  )
}

type MetaStatus = 'new' | 'dirty' | 'saved' | 'published'

function computeMetaStatus(input: {
  isDirty: boolean
  isEditing: boolean
  isPendingDraftSave: boolean
  latestDraft?: DraftModel
  publishedUpdatedAt?: string
}): { status: MetaStatus; text: string } {
  if (input.isPendingDraftSave) {
    return { status: 'dirty', text: '保存草稿中…' }
  }
  if (input.isDirty) {
    const versionSuffix = input.latestDraft
      ? ` · v${input.latestDraft.version}`
      : ''
    return { status: 'dirty', text: `未保存改动${versionSuffix}` }
  }
  if (input.latestDraft) {
    const savedAt =
      input.latestDraft.updatedAt ?? input.latestDraft.createdAt ?? ''
    const suffix = savedAt ? ` · 保存于 ${formatRelativeTime(savedAt)}` : ''
    return {
      status: 'saved',
      text: `草稿 v${input.latestDraft.version}${suffix}`,
    }
  }
  if (input.isEditing && input.publishedUpdatedAt) {
    return {
      status: 'published',
      text: `已发布 · 同步于 ${formatRelativeTime(input.publishedUpdatedAt)}`,
    }
  }
  return { status: 'new', text: '新建未保存' }
}

function formatRelativeTime(value: string | null | undefined) {
  if (value == null || value === '') return '-'
  const ts = Date.parse(value)
  if (Number.isNaN(ts)) return '-'
  const diffMs = Date.now() - ts
  if (diffMs < 0) return formatDateTime(value)
  const sec = Math.round(diffMs / 1000)
  if (sec < 45) return '刚刚'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} 分钟前`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day} 天前`
  return formatDateTime(value)
}

function EditorMetaStrip(props: {
  aiButtonPending: boolean
  aiButtonVisible: boolean
  canSwitchFormat: boolean
  format: ContentFormat
  onAiGenerate: () => void
  onToggleFormat: () => void
  status: MetaStatus
  statusText: string
}) {
  const dotClass =
    props.status === 'dirty'
      ? 'bg-amber-500'
      : props.status === 'saved' || props.status === 'published'
        ? 'bg-emerald-500'
        : 'bg-neutral-300 dark:bg-neutral-600'
  const formatLabel =
    props.format === 'lexical' ? '切换到 Markdown' : '切换到 Lexical'

  return (
    <div className="group mb-3 flex items-center justify-between opacity-60 transition-opacity duration-200 hover:opacity-100">
      <div className="flex min-w-0 items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span
          aria-hidden="true"
          className={cn(
            'inline-block size-1.5 shrink-0 rounded-full',
            dotClass,
          )}
        />
        <span className="truncate">{props.statusText}</span>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {props.canSwitchFormat ? (
          <button
            aria-label={formatLabel}
            className="focus-visible:outline-hidden inline-flex size-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:ring-1 focus-visible:ring-neutral-400 dark:text-neutral-500 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
            onClick={props.onToggleFormat}
            title={formatLabel}
            type="button"
          >
            <ArrowLeftRight aria-hidden="true" className="size-3.5" />
          </button>
        ) : null}
        {props.aiButtonVisible ? (
          <button
            aria-label="AI 生成标题与 Slug"
            className="focus-visible:outline-hidden inline-flex size-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
            disabled={props.aiButtonPending}
            onClick={props.onAiGenerate}
            title="AI 生成标题与 Slug"
            type="button"
          >
            {props.aiButtonPending ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <WandSparkles aria-hidden="true" className="size-3.5" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function EditorTitleArea(props: {
  autoFocus: boolean
  copyPageUrl?: () => void
  displayPath: string
  onSlugChange: (value: string) => void
  onTitleChange: (value: string) => void
  placeholder: string
  required: boolean
  showSlugPill: boolean
  slug: string
  slugPlaceholder: string
  slugPrefix: string
  subtitle: ReactNode
  title: string
}) {
  return (
    <div className="group">
      <input
        autoFocus={props.autoFocus}
        className="outline-hidden w-full border-0 bg-transparent px-0 py-0 text-3xl font-semibold tracking-tight text-neutral-950 placeholder:font-medium placeholder:text-neutral-300 dark:text-neutral-50 dark:placeholder:text-neutral-700"
        onChange={(event) => props.onTitleChange(event.target.value)}
        placeholder={props.placeholder}
        required={props.required}
        value={props.title}
      />
      {props.showSlugPill ? (
        <SlugPill
          copyPageUrl={props.copyPageUrl}
          displayPath={props.displayPath}
          onSlugChange={props.onSlugChange}
          slug={props.slug}
          slugPlaceholder={props.slugPlaceholder}
          slugPrefix={props.slugPrefix}
        />
      ) : null}
      {props.subtitle}
    </div>
  )
}

function SlugPill(props: {
  copyPageUrl?: () => void
  displayPath: string
  onSlugChange: (value: string) => void
  slug: string
  slugPlaceholder: string
  slugPrefix: string
}) {
  const [open, setOpen] = useState(false)
  const hasSlug = Boolean(props.slug.trim())
  const triggerLabel = hasSlug ? props.displayPath : '+ 添加 slug'

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Trigger
        aria-label={hasSlug ? '编辑 slug' : '添加 slug'}
        className={cn(
          'focus-visible:outline-hidden -ml-1 mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs text-neutral-500 transition-opacity duration-150 hover:bg-neutral-100 focus-visible:ring-1 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:hover:bg-neutral-900',
          hasSlug
            ? 'opacity-0 hover:!opacity-100 focus-visible:!opacity-100 group-hover:opacity-70'
            : 'opacity-0 hover:!opacity-100 focus-visible:!opacity-100 group-hover:opacity-50',
        )}
        type="button"
      >
        <span className="truncate">{triggerLabel}</span>
        <Pencil aria-hidden="true" className="size-3 shrink-0" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="start" side="bottom" sideOffset={6}>
          <Popover.Popup className="outline-hidden w-80 rounded-md border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Slug
            </div>
            <div className="mt-2 flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 font-mono text-xs dark:border-neutral-800 dark:bg-neutral-900">
              {props.slugPrefix ? (
                <span className="select-none text-neutral-400">
                  {props.slugPrefix}
                </span>
              ) : null}
              <input
                autoFocus
                className="outline-hidden min-w-0 flex-1 bg-transparent text-neutral-800 placeholder:text-neutral-400 dark:text-neutral-100"
                onChange={(event) => props.onSlugChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    setOpen(false)
                  }
                }}
                placeholder={props.slugPlaceholder}
                value={props.slug}
              />
            </div>
            {props.copyPageUrl ? (
              <div className="mt-2 flex justify-end">
                <button
                  className="focus-visible:outline-hidden inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
                  disabled={!hasSlug}
                  onClick={props.copyPageUrl}
                  type="button"
                >
                  <Copy aria-hidden="true" className="size-3" />
                  复制链接
                </button>
              </div>
            ) : null}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function buildRecoveryVersionItems(
  draft: DraftModel,
  history:
    | Array<{
        savedAt: string
        title: string
        version: number
      }>
    | undefined,
) {
  return [...(history ?? [])]
    .filter((item) => item.version !== draft.version)
    .sort((a, b) => b.version - a.version)
    .map((item) => ({
      savedAt: item.savedAt,
      title: item.title,
      version: item.version,
    }))
}

function getDraftDiffStats(
  publishedContent: PublishedWriteContent,
  selectedContent: PublishedWriteContent | DraftModel,
) {
  const publishedText = publishedContent.text || publishedContent.content || ''
  const selectedText = selectedContent.text || selectedContent.content || ''
  const sharedPrefixLength = getSharedPrefixLength(publishedText, selectedText)
  const publishedRemainder = publishedText.slice(sharedPrefixLength)
  const selectedRemainder = selectedText.slice(sharedPrefixLength)
  const sharedSuffixLength = getSharedSuffixLength(
    publishedRemainder,
    selectedRemainder,
  )
  const removed = Math.max(0, publishedRemainder.length - sharedSuffixLength)
  const added = Math.max(0, selectedRemainder.length - sharedSuffixLength)

  return {
    added,
    isSame: publishedText === selectedText,
    removed,
  }
}

function getSharedPrefixLength(left: string, right: string) {
  const maxLength = Math.min(left.length, right.length)
  let index = 0

  while (index < maxLength && left[index] === right[index]) {
    index += 1
  }

  return index
}

function getSharedSuffixLength(left: string, right: string) {
  const maxLength = Math.min(left.length, right.length)
  let index = 0

  while (
    index < maxLength &&
    left[left.length - 1 - index] === right[right.length - 1 - index]
  ) {
    index += 1
  }

  return index
}

function PostFields(props: {
  categories: CategoryModel[]
  currentPostId: string
  relatedPosts: PostModel[]
  state: WriteFormState
  tags: Array<{ count: number; name: string }>
  updateField: <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => void
}) {
  const selectedTags = splitCommaList(props.state.tags)
  const selectedRelatedIds = splitCommaList(props.state.relatedId)
  const visibleRelatedPosts = props.relatedPosts.filter(
    (post) => post.id !== props.currentPostId,
  )
  const toggleTag = (tag: string) => {
    props.updateField('tags', toggleListValue(selectedTags, tag).join(', '))
  }
  const toggleRelatedPost = (postId: string) => {
    props.updateField(
      'relatedId',
      toggleListValue(selectedRelatedIds, postId).join(', '),
    )
  }

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
          list="write-post-tags"
          label="标签"
          onChange={(value) => props.updateField('tags', value)}
          placeholder="用逗号分隔"
          value={props.state.tags}
        />
        <datalist id="write-post-tags">
          {props.tags.map((tag) => (
            <option key={tag.name} label={`${tag.name} (${tag.count})`}>
              {tag.name}
            </option>
          ))}
        </datalist>
        {props.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {props.tags.slice(0, 24).map((tag) => {
              const selected = selectedTags.includes(tag.name)

              return (
                <button
                  className={cn(
                    'rounded border px-2 py-1 text-xs transition-colors',
                    selected
                      ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900',
                  )}
                  key={tag.name}
                  onClick={() => toggleTag(tag.name)}
                  type="button"
                >
                  {tag.name}
                  <span className="text-current/60 ml-1">{tag.count}</span>
                </button>
              )
            })}
          </div>
        ) : null}
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
        <Switch
          checked={props.state.pin}
          label="置顶"
          onCheckedChange={(checked) => props.updateField('pin', checked)}
        />
        {props.state.pin ? (
          <TextInput
            controlClassName="h-9 focus:border-neutral-400"
            inputMode="numeric"
            label="置顶顺序"
            onChange={(value) => props.updateField('pinOrder', value)}
            value={props.state.pinOrder}
          />
        ) : null}
      </PanelBlock>

      <PanelBlock title="关联阅读">
        {visibleRelatedPosts.length > 0 ? (
          <>
            <SelectField
              aria-label="添加关联文章"
              onValueChange={(postId) => {
                if (postId && !selectedRelatedIds.includes(postId)) {
                  toggleRelatedPost(postId)
                }
              }}
              options={[
                { label: '选择文章添加…', value: '' },
                ...visibleRelatedPosts
                  .filter((post) => !selectedRelatedIds.includes(post.id))
                  .map((post) => ({
                    label: post.category?.name
                      ? `${post.category.name} · ${post.title}`
                      : post.title,
                    value: post.id,
                  })),
              ]}
              value=""
            />
            {selectedRelatedIds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedRelatedIds.map((id) => {
                  const post = visibleRelatedPosts.find((p) => p.id === id)
                  const label = post ? post.title : `${id.slice(0, 8)}…`
                  return (
                    <span
                      className="inline-flex max-w-full items-center gap-1 rounded-sm border border-neutral-200 bg-neutral-50 py-1 pl-2 pr-1 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                      key={id}
                    >
                      <span className="truncate">{label}</span>
                      <button
                        aria-label="移除"
                        className="inline-flex size-4 shrink-0 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        onClick={() => toggleRelatedPost(id)}
                        type="button"
                      >
                        <X aria-hidden="true" className="size-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            暂无可关联文章。
          </p>
        )}
        <TextInput
          controlClassName="h-9 font-mono focus:border-neutral-400"
          label="相关文章 ID"
          onChange={(value) => props.updateField('relatedId', value)}
          placeholder="用逗号分隔，也可从上方选择"
          value={props.state.relatedId}
        />
      </PanelBlock>
    </>
  )
}

function MetadataPill(props: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'rounded border px-2 py-1 text-xs transition-colors',
        props.active
          ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950'
          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900',
      )}
      onClick={props.onClick}
      type="button"
    >
      {props.children}
    </button>
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
  const [locationSearchOpen, setLocationSearchOpen] = useState(false)
  const updateLocation = (
    location: string,
    coordinates: NoteCoordinates | null,
  ) => {
    props.updateField('location', location)
    props.updateField(
      'coordinatesLat',
      typeof coordinates?.latitude === 'number'
        ? String(coordinates.latitude)
        : '',
    )
    props.updateField(
      'coordinatesLng',
      typeof coordinates?.longitude === 'number'
        ? String(coordinates.longitude)
        : '',
    )
  }

  return (
    <>
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
        <TextInput
          controlClassName="h-9 focus:border-neutral-400"
          list="write-note-moods"
          label="心情"
          onChange={(value) => props.updateField('mood', value)}
          placeholder="选择或输入心情"
          value={props.state.mood}
        />
        <datalist id="write-note-moods">
          {MOOD_SET.map((mood) => (
            <option key={mood}>{mood}</option>
          ))}
        </datalist>
        <div className="flex flex-wrap gap-1.5">
          {MOOD_SET.map((mood) => (
            <MetadataPill
              active={props.state.mood === mood}
              key={mood}
              onClick={() => props.updateField('mood', mood)}
            >
              {mood}
            </MetadataPill>
          ))}
        </div>
        <TextInput
          controlClassName="h-9 focus:border-neutral-400"
          list="write-note-weathers"
          label="天气"
          onChange={(value) => props.updateField('weather', value)}
          placeholder="选择或输入天气"
          value={props.state.weather}
        />
        <datalist id="write-note-weathers">
          {WEATHER_SET.map((weather) => (
            <option key={weather}>{weather}</option>
          ))}
        </datalist>
        <div className="flex flex-wrap gap-1.5">
          {WEATHER_SET.map((weather) => (
            <MetadataPill
              active={props.state.weather === weather}
              key={weather}
              onClick={() => props.updateField('weather', weather)}
            >
              {weather}
            </MetadataPill>
          ))}
        </div>
        <Switch
          checked={props.state.bookmark}
          label="回忆标记"
          onCheckedChange={(checked) => props.updateField('bookmark', checked)}
        />
      </PanelBlock>

      <PanelBlock title="公开与位置">
        <DateTimePicker
          controlClassName="h-9 focus:border-neutral-400"
          label="定时公开"
          min={toDatetimeLocalValue(new Date())}
          onChange={(value) => props.updateField('publicAt', value)}
          placeholder="选择定时公开时间"
          value={props.state.publicAt}
        />
        <div className="grid grid-cols-2 gap-1.5">
          {[
            ['一天后', { days: 1 }],
            ['一周后', { days: 7 }],
            ['半个月后', { days: 14 }],
            ['一个月后', { months: 1 }],
          ].map(([label, offset]) => (
            <button
              className="h-8 rounded border border-neutral-200 bg-white px-2 text-xs text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
              key={label as string}
              onClick={() =>
                props.updateField(
                  'publicAt',
                  toDatetimeLocalValue(
                    addDateOffset(new Date(), offset as DateOffset),
                  ),
                )
              }
              type="button"
            >
              {label as string}
            </button>
          ))}
        </div>
        <TextInput
          controlClassName="h-9 focus:border-neutral-400"
          label="位置"
          onChange={(value) => props.updateField('location', value)}
          value={props.state.location}
        />
        <div className="flex flex-wrap gap-2">
          <GetCurrentLocationButton onChange={updateLocation} />
          <Button
            onClick={() => setLocationSearchOpen(true)}
            type="button"
            variant="subtle"
          >
            <Search aria-hidden="true" className="size-4" />
            自定义
          </Button>
          <Button
            disabled={
              !props.state.location &&
              !props.state.coordinatesLat &&
              !props.state.coordinatesLng
            }
            onClick={() => updateLocation('', null)}
            type="button"
            variant="subtle"
          >
            清除
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <TextInput
            controlClassName="h-9 focus:border-neutral-400"
            inputMode="decimal"
            label="纬度"
            onChange={(value) => props.updateField('coordinatesLat', value)}
            value={props.state.coordinatesLat}
          />
          <TextInput
            controlClassName="h-9 focus:border-neutral-400"
            inputMode="decimal"
            label="经度"
            onChange={(value) => props.updateField('coordinatesLng', value)}
            value={props.state.coordinatesLng}
          />
        </div>
        <LocationSearchDialog
          onClose={() => setLocationSearchOpen(false)}
          onSelect={(location, coordinates) => {
            updateLocation(location, coordinates)
            setLocationSearchOpen(false)
          }}
          open={locationSearchOpen}
          placeholder={props.state.location}
        />
      </PanelBlock>

      <PanelBlock title="访问保护">
        <Switch
          checked={props.state.passwordProtected}
          label="密码保护"
          onCheckedChange={(checked) =>
            props.updateField('passwordProtected', checked)
          }
        />
        {props.state.passwordProtected ? (
          <TextInput
            autoComplete="new-password"
            controlClassName="h-9 focus:border-neutral-400"
            label="访问密码"
            onChange={(value) => props.updateField('password', value)}
            placeholder="留空保持原密码"
            type="password"
            value={props.state.password}
          />
        ) : null}
      </PanelBlock>
    </>
  )
}

function GetCurrentLocationButton(props: {
  onChange: (location: string, coordinates: NoteCoordinates) => void
}) {
  const mutation = useMutation({
    mutationFn: async () => {
      if (!navigator.geolocation) {
        throw new Error('浏览器不支持定位')
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject)
        },
      )
      const { latitude, longitude } = position.coords
      const result = await callBuiltInFunction<Amap>('geocode_location', {
        latitude,
        longitude,
      })

      return {
        coordinates: { latitude, longitude },
        location: result.regeocode.formattedAddress,
      }
    },
    onError(error) {
      const geolocationErrorCode = isRecord(error) ? error.code : undefined
      if (geolocationErrorCode === 2) {
        toast.error('获取定位失败，连接超时')
        return
      }
      toast.error(error instanceof Error ? error.message : '定位权限未打开')
    },
    onSuccess(result) {
      props.onChange(result.location, result.coordinates)
    },
  })

  return (
    <Button
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
      type="button"
      variant="subtle"
    >
      {mutation.isPending ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <MapPin aria-hidden="true" className="size-4" />
      )}
      定位
    </Button>
  )
}

function LocationSearchDialog(props: {
  onClose: () => void
  onSelect: (location: string, coordinates: NoteCoordinates) => void
  open: boolean
  placeholder?: string
}) {
  const [keyword, setKeyword] = useState('')
  const [options, setOptions] = useState<
    Array<{ coordinates: NoteCoordinates; id: string; label: string }>
  >([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!props.open) {
      setKeyword('')
      setOptions([])
      return
    }

    const trimmedKeyword = keyword.trim()
    if (!trimmedKeyword) {
      setOptions([])
      return
    }

    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      setLoading(true)
      callBuiltInFunction<AMapSearch>('geocode_search', {
        keywords: trimmedKeyword,
      })
        .then((result) => {
          if (cancelled) return
          setOptions(
            result.pois
              .map((poi) => {
                const [longitude, latitude] = poi.location
                  .split(',')
                  .map(Number)
                if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                  return null
                }

                return {
                  coordinates: { latitude, longitude },
                  id: poi.id,
                  label: [poi.cityname, poi.adname, poi.address, poi.name]
                    .filter(Boolean)
                    .join(''),
                }
              })
              .filter(
                (
                  option,
                ): option is {
                  coordinates: NoteCoordinates
                  id: string
                  label: string
                } => Boolean(option),
              ),
          )
        })
        .catch((error: unknown) => {
          if (cancelled) return
          toast.error(error instanceof Error ? error.message : '搜索地点失败')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [keyword, props.open])

  return (
    <Modal
      className="w-[min(92vw,30rem)]"
      onClose={props.onClose}
      open={props.open}
    >
      <ModalHeader icon={Search} title="搜索关键字查找地点" />

      <div className="grid gap-3 p-4">
        <TextInput
          autoFocus
          controlClassName="h-9 focus:border-neutral-400"
          label="搜索地点"
          onChange={setKeyword}
          placeholder={props.placeholder || '输入地点关键字'}
          value={keyword}
        />
        <Scroll className="max-h-72" viewportClassName="max-h-72">
          <div className="grid gap-1 pr-1">
            {loading ? (
              <div className="flex h-24 items-center justify-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                搜索中
              </div>
            ) : options.length > 0 ? (
              options.map((option) => (
                <button
                  className="grid gap-1 rounded px-3 py-2 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  key={option.id}
                  onClick={() =>
                    props.onSelect(option.label, option.coordinates)
                  }
                  type="button"
                >
                  <span className="text-sm text-neutral-900 dark:text-neutral-100">
                    {option.label}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {option.coordinates.longitude.toFixed(6)},{' '}
                    {option.coordinates.latitude.toFixed(6)}
                  </span>
                </button>
              ))
            ) : (
              <div className="flex h-24 items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
                {keyword.trim() ? '暂无匹配地点' : '输入关键字开始搜索'}
              </div>
            )}
          </div>
        </Scroll>
      </div>
    </Modal>
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
    <PanelBlock
      description="这些字段对应旧版页面设置抽屉中的文档专属选项。"
      icon={FileText}
      title="页面选项"
    >
      <TextInput
        controlClassName="h-9 focus:border-neutral-400"
        inputMode="numeric"
        label="页面顺序"
        min="0"
        onChange={(value) => props.updateField('order', value)}
        placeholder="输入排序数字"
        type="number"
        value={props.state.order}
      />
      <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
        用于控制页面在导航中的显示顺序，数字越小越靠前。
      </p>
    </PanelBlock>
  )
}

function MediaAndMetaFields(props: {
  kind: WriteKind
  state: WriteFormState
  updateField: <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => void
}) {
  const images = buildWriteImages(props.state)
  const cover = getMetaString(props.state.meta, 'cover')

  return (
    <>
      <PanelBlock
        description="封面仍写入 meta.cover；候选项来自正文、编辑器图片与现有封面。"
        icon={ImageIcon}
        title="图片设置"
      >
        <TextInput
          controlClassName="h-9 focus:border-neutral-400"
          label="文章缩略图"
          list="page-cover-image-options"
          onChange={(value) =>
            props.updateField(
              'meta',
              setMetaValue(props.state.meta, 'cover', value),
            )
          }
          placeholder="选择或输入图片 URL"
          value={cover}
        />
        {images.length > 0 ? (
          <datalist id="page-cover-image-options">
            {images.map((image) => (
              <option key={image.src} value={image.src} />
            ))}
          </datalist>
        ) : null}
        {cover ? (
          <div className="overflow-hidden border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60">
            <img
              alt="封面预览"
              className="max-h-48 w-full object-contain"
              src={cover}
            />
          </div>
        ) : null}
        {images.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              将随内容保存 {images.length} 张图片。
            </div>
            <div className="grid gap-1.5">
              {images.slice(0, 6).map((image) => (
                <div
                  className="truncate border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300"
                  key={image.src}
                  title={image.src}
                >
                  {image.src}
                </div>
              ))}
              {images.length > 6 ? (
                <div className="text-xs text-neutral-400 dark:text-neutral-500">
                  另有 {images.length - 6} 张图片。
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            正文、编辑器或封面图中的图片会在保存时写入图片信息。
          </p>
        )}
      </PanelBlock>

      <PanelBlock icon={Braces} title="附加字段">
        {props.kind === 'page' ? (
          <MetaJsonField state={props.state} updateField={props.updateField} />
        ) : (
          <MetaPresetSection
            meta={props.state.meta}
            onUpdateMeta={(meta) => props.updateField('meta', meta)}
            scope={props.kind === 'post' ? 'post' : 'note'}
          />
        )}
      </PanelBlock>
    </>
  )
}

function MetaJsonField(props: {
  state: WriteFormState
  updateField: <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => void
}) {
  const [value, setValue] = useState(() => formatMetaJson(props.state.meta))
  const [error, setError] = useState('')

  useEffect(() => {
    setValue(formatMetaJson(props.state.meta))
    setError('')
  }, [props.state.meta])

  const apply = () => {
    const trimmed = value.trim()
    if (!trimmed) {
      setError('')
      props.updateField('meta', {})
      return
    }

    try {
      const parsed = JSON.parse(trimmed)
      if (!isRecord(parsed)) {
        setError('附加字段必须是 JSON 对象')
        return
      }
      setError('')
      props.updateField('meta', parsed)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'JSON 解析失败')
    }
  }

  return (
    <div className="space-y-2">
      <TextArea
        controlClassName="min-h-32 font-mono text-xs leading-5 focus:border-neutral-400"
        label="Meta JSON"
        onBlur={apply}
        onChange={setValue}
        placeholder='{"cover":"https://..."}'
        value={value}
      />
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            'min-w-0 text-xs',
            error
              ? 'text-red-600 dark:text-red-400'
              : 'text-neutral-500 dark:text-neutral-400',
          )}
        >
          {error || '失焦后应用，空对象不会写入额外字段。'}
        </p>
        <Button onClick={apply} type="button" variant="subtle">
          应用
        </Button>
      </div>
    </div>
  )
}

interface ParsedPageMarkdown {
  meta?: Record<string, unknown>
  order?: string
  slug?: string
  subtitle?: string
  text: string
  title?: string
}

function PageParseMarkdownDialog(props: {
  onApply: (parsed: ParsedPageMarkdown) => void
  onClose: () => void
  open: boolean
}) {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (!props.open) {
      setValue('')
    }
  }, [props.open])

  const apply = () => {
    const parsed = parsePageMarkdown(value)

    if (!parsed.text.trim() && !parsed.title?.trim()) {
      toast.error('请输入可解析的 Markdown 内容')
      return
    }

    props.onApply(parsed)
  }

  return (
    <Modal
      onClose={props.onClose}
      open={props.open}
      popupStyle={{ height: 'min(82vh, 42rem)', width: 'min(92vw, 56rem)' }}
    >
      <ModalHeader title="解析 Markdown" />
      <div className="min-h-0 flex-1 p-4">
        <TextArea
          controlClassName="h-full min-h-0 resize-none rounded border-neutral-200 font-mono text-xs leading-5 focus:border-neutral-400 dark:border-neutral-800"
          onChange={setValue}
          placeholder={`---
title: 关于我
slug: about
subtitle: 个人介绍
order: 1
---

# 关于我

正文内容...`}
          value={value}
        />
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <p className="min-w-0 text-xs text-neutral-500 dark:text-neutral-400">
          支持 YAML 头部的
          title、slug、subtitle、order，并将一级标题作为页面标题。
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={() => setValue('')} type="button" variant="subtle">
            重置
          </Button>
          <Button onClick={apply} type="button">
            确定
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function PageLexicalDebugDialog(props: {
  content: string
  onClose: () => void
  open: boolean
}) {
  const formattedContent = useMemo(
    () => formatLexicalDebugContent(props.content),
    [props.content],
  )

  const copyContent = () => {
    void navigator.clipboard
      .writeText(formattedContent)
      .then(() => toast.success('Lexical State 已复制'))
      .catch(() => toast.error('复制失败'))
  }

  return (
    <Drawer
      footer={
        <>
          <p className="min-w-0 flex-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
            只读查看当前页面富文本序列化状态。
          </p>
          <Button onClick={copyContent} type="button" variant="subtle">
            复制
          </Button>
        </>
      }
      icon={Bug}
      onClose={props.onClose}
      open={props.open}
      title="Lexical State"
      widthClassName="w-[min(92vw,38rem)]"
    >
      <Scroll className="min-h-0 flex-1" innerClassName="p-4">
        <pre className="min-h-full whitespace-pre-wrap break-words border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs leading-5 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200">
          {formattedContent}
        </pre>
      </Scroll>
    </Drawer>
  )
}

function formatLexicalDebugContent(content: string) {
  if (!content.trim()) return '{}'

  try {
    return JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    return content
  }
}

function parsePageMarkdown(value: string): ParsedPageMarkdown {
  let text = value.trim()
  const parsed: ParsedPageMarkdown = { text: '' }
  const yamlHeader = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)

  if (yamlHeader) {
    const meta = parseYamlMeta(yamlHeader[1])
    const { order, slug, subtitle, title, ...restMeta } = meta

    parsed.title = optionalString(title)
    parsed.slug = optionalString(slug)
    parsed.subtitle = optionalString(subtitle)
    if (order != null) {
      parsed.order = String(order)
    }
    if (Object.keys(restMeta).length > 0) {
      parsed.meta = restMeta
    }
    text = text.replace(yamlHeader[0], '').trim()
  }

  const lines = text.split('\n')
  const firstLine = lines[0]?.trim() ?? ''
  if (firstLine.startsWith('#')) {
    const headingTitle = firstLine.replace(/^#+/, '').trim()

    if (headingTitle) {
      parsed.title = headingTitle
      lines.shift()
    }
  }

  parsed.text = lines.join('\n').trim()
  return parsed
}

function parseYamlMeta(value: string): Record<string, unknown> {
  try {
    const meta = load(value)

    return meta && typeof meta === 'object' && !Array.isArray(meta)
      ? (meta as Record<string, unknown>)
      : {}
  } catch (error) {
    const message = error instanceof Error ? error.message : 'YAML 解析失败'

    toast.error(message)
    return {}
  }
}

function optionalString(value: unknown) {
  if (value == null) return undefined

  return String(value)
}

function getHashRouterRoute(href: string) {
  try {
    const url = new URL(href, window.location.href)
    if (url.origin !== window.location.origin) return ''
    if (!url.hash.startsWith('#/')) return ''

    return url.hash.slice(1) || '/'
  } catch {
    return ''
  }
}

function getRoutePathname(route: string) {
  return route.split(/[?#]/, 1)[0] || '/'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getMetaString(meta: Record<string, unknown>, key: string) {
  const value = meta[key]
  return typeof value === 'string' ? value : ''
}

function setMetaValue(
  meta: Record<string, unknown>,
  key: string,
  value: unknown,
) {
  const next = { ...meta }

  if (value == null || value === '') {
    delete next[key]
  } else {
    next[key] = value
  }

  return next
}

function formatMetaJson(meta: Record<string, unknown>) {
  return Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : ''
}

function buildWriteImages(state: WriteFormState): ImageModel[] {
  const images = new Map<string, ImageModel>()
  const addImage = (image: ImageModel | null | undefined) => {
    if (!image?.src) return
    images.set(image.src, image)
  }
  const addImageSrc = (src: string | undefined) => {
    if (!src || images.has(src)) return
    images.set(src, {
      accent: '',
      height: 0,
      src,
      type: getFileExtension(src),
      width: 0,
    })
  }

  for (const image of state.images) addImage(image)
  for (const src of pickImagesFromMarkdown(state.text)) addImageSrc(src)
  addImageSrc(getMetaString(state.meta, 'cover'))

  return [...images.values()]
}

function pickImagesFromMarkdown(text: string) {
  const images: string[] = []
  const imagePattern = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g

  for (const match of text.matchAll(imagePattern)) {
    if (match[1]) images.push(match[1])
  }

  return images
}

function getFileExtension(src: string) {
  const pathname = src.split(/[?#]/)[0] ?? src
  return pathname.split('.').pop() || ''
}

function applyParsedPageMarkdown(
  state: WriteFormState,
  parsed: ParsedPageMarkdown,
): WriteFormState {
  return {
    ...state,
    meta: parsed.meta ?? state.meta,
    order: parsed.order ?? state.order,
    slug: parsed.slug ?? state.slug,
    subtitle: parsed.subtitle ?? state.subtitle,
    text: parsed.text,
    title: parsed.title ?? state.title,
  }
}

function PageSettingsPanel(props: {
  state: WriteFormState
  updateField: <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => void
}) {
  return (
    <AsidePanel>
      <Scroll
        className="min-h-0 flex-1"
        innerClassName="grid grid-cols-[minmax(0,1fr)] gap-5 px-5 py-4"
      >
        <PageFields state={props.state} updateField={props.updateField} />
        <MediaAndMetaFields
          kind="page"
          state={props.state}
          updateField={props.updateField}
        />
      </Scroll>
    </AsidePanel>
  )
}

function PanelBlock(props: {
  children: ReactNode
  description?: string
  icon?: LucideIcon
  title: string
}) {
  const Icon = props.icon

  return (
    <section className="border-b border-neutral-200 pb-5 last:border-b-0 dark:border-neutral-800">
      <div className="mb-3 grid gap-1">
        <h3 className="inline-flex items-center gap-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
          {Icon ? <Icon aria-hidden="true" className="size-3.5" /> : null}
          <span>{props.title}</span>
        </h3>
        {props.description ? (
          <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            {props.description}
          </p>
        ) : null}
      </div>
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

function WriteSkeleton(props: { kind: WriteKind }) {
  if (props.kind === 'page') {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-neutral-950">
        <div className="mx-auto w-full max-w-[60rem] shrink-0 px-3 pb-2 pt-6">
          <div className="h-14 w-full animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-900" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
        <div className="mx-auto mt-6 h-[34rem] w-full max-w-[60rem] px-3">
          <div className="h-full animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      </div>
    )
  }

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

function getPublishedContent(model: WriteModel): PublishedWriteContent {
  return {
    content: model.content ?? undefined,
    contentFormat: model.contentFormat,
    text: model.text ?? '',
    title: model.title,
    updatedAt: model.modifiedAt || model.createdAt,
  }
}

function isDraftNewerThanPublished(draft: DraftModel, model: WriteModel) {
  const draftUpdatedAt = Date.parse(draft.updatedAt)
  const publishedUpdatedAt = Date.parse(model.modifiedAt || model.createdAt)

  if (Number.isNaN(draftUpdatedAt) || Number.isNaN(publishedUpdatedAt)) {
    return true
  }

  return draftUpdatedAt > publishedUpdatedAt
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
      images: post.images ?? [],
      isPublished: post.isPublished ?? true,
      meta: isRecord(post.meta) ? post.meta : {},
      pin: Boolean(post.pinAt),
      pinOrder: String(post.pinOrder ?? 1),
      relatedId: post.related?.map((item) => item.id).join(', ') ?? '',
      slug: post.slug,
      summary: post.summary ?? '',
      tags: post.tags.join(', '),
      text: post.text ?? '',
      title: post.title,
    }
  }

  if (kind === 'note') {
    const note = model as NoteModel
    return {
      ...emptyState,
      content: note.content ?? '',
      contentFormat: note.contentFormat ?? 'markdown',
      bookmark: note.bookmark,
      coordinatesLat:
        typeof note.coordinates?.latitude === 'number'
          ? String(note.coordinates.latitude)
          : '',
      coordinatesLng:
        typeof note.coordinates?.longitude === 'number'
          ? String(note.coordinates.longitude)
          : '',
      isPublished: note.isPublished,
      images: note.images ?? [],
      location: note.location ?? '',
      meta: isRecord(note.meta) ? note.meta : {},
      mood: note.mood ?? '',
      password: '',
      passwordProtected: Boolean(note.hasPassword || note.password),
      publicAt: toDatetimeLocalValue(note.publicAt),
      slug: note.slug ?? '',
      text: note.text ?? '',
      title: note.title,
      topicId: note.topicId ?? '',
      weather: note.weather ?? '',
    }
  }

  const page = model as PageModel
  return {
    ...emptyState,
    content: page.content ?? '',
    contentFormat: page.contentFormat ?? 'markdown',
    images: page.images ?? [],
    isPublished: true,
    meta: isRecord(page.meta) ? page.meta : {},
    order: typeof page.order === 'number' ? String(page.order) : '',
    slug: page.slug,
    subtitle: page.subtitle ?? '',
    text: page.text ?? '',
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
    images: draft.images ?? previous.images,
    meta: isRecord(draft.meta) ? draft.meta : previous.meta,
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
      pin: 'pin' in specific ? Boolean(specific.pin) : previous.pin,
      pinOrder:
        typeof specific.pinOrder === 'number'
          ? String(specific.pinOrder)
          : previous.pinOrder,
      relatedId: Array.isArray(specific.relatedId)
        ? specific.relatedId.map((id) => String(id)).join(', ')
        : previous.relatedId,
      slug: typeof specific.slug === 'string' ? specific.slug : previous.slug,
      summary:
        'summary' in specific
          ? typeof specific.summary === 'string'
            ? specific.summary
            : ''
          : previous.summary,
      tags: Array.isArray(specific.tags)
        ? specific.tags.map((tag) => String(tag)).join(', ')
        : previous.tags,
    }
  }

  if (kind === 'note') {
    return {
      ...base,
      bookmark:
        typeof specific.bookmark === 'boolean'
          ? specific.bookmark
          : previous.bookmark,
      coordinatesLat:
        'coordinates' in specific && specific.coordinates == null
          ? ''
          : typeof specific.coordinates?.latitude === 'number'
            ? String(specific.coordinates.latitude)
            : previous.coordinatesLat,
      coordinatesLng:
        'coordinates' in specific && specific.coordinates == null
          ? ''
          : typeof specific.coordinates?.longitude === 'number'
            ? String(specific.coordinates.longitude)
            : previous.coordinatesLng,
      isPublished:
        typeof specific.isPublished === 'boolean'
          ? specific.isPublished
          : previous.isPublished,
      location:
        typeof specific.location === 'string'
          ? specific.location
          : previous.location,
      mood: typeof specific.mood === 'string' ? specific.mood : previous.mood,
      password:
        typeof specific.password === 'string'
          ? specific.password
          : 'password' in specific
            ? ''
            : previous.password,
      passwordProtected: resolveDraftPasswordProtected(specific, previous),
      publicAt:
        'publicAt' in specific && specific.publicAt == null
          ? ''
          : typeof specific.publicAt === 'string'
            ? toDatetimeLocalValue(specific.publicAt)
            : previous.publicAt,
      slug: typeof specific.slug === 'string' ? specific.slug : previous.slug,
      topicId:
        'topicId' in specific
          ? typeof specific.topicId === 'string'
            ? specific.topicId
            : ''
          : previous.topicId,
      weather:
        typeof specific.weather === 'string'
          ? specific.weather
          : previous.weather,
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
      'subtitle' in specific
        ? typeof specific.subtitle === 'string'
          ? specific.subtitle
          : ''
        : previous.subtitle,
  }
}

function resolveDraftPasswordProtected(
  specific: Record<string, any>,
  previous: WriteFormState,
) {
  if (typeof specific.passwordProtected === 'boolean') {
    return specific.passwordProtected
  }

  if (!('password' in specific)) {
    return previous.passwordProtected
  }

  if (typeof specific.password === 'string') {
    return specific.password.length > 0 || previous.passwordProtected
  }

  return previous.passwordProtected
}

function saveWrite(
  kind: WriteKind,
  id: string,
  state: WriteFormState,
  draftId?: string,
): Promise<WriteModel> {
  if (kind === 'post') {
    const data = {
      categoryId: state.categoryId,
      content: state.contentFormat === 'lexical' ? state.content : undefined,
      contentFormat: state.contentFormat,
      copyright: state.copyright,
      draftId,
      images: buildWriteImages(state),
      isPublished: state.isPublished,
      meta: state.meta,
      pin: state.pin ? new Date().toISOString() : null,
      pinOrder: state.pin ? Number(state.pinOrder) || 1 : null,
      relatedId: splitCommaList(state.relatedId),
      slug: state.slug,
      summary: state.summary || null,
      tags: state.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      text: state.text,
      title: state.title,
    }

    return id ? updatePost(id, data) : createPost(data)
  }

  if (kind === 'note') {
    const data = {
      bookmark: state.bookmark,
      content: state.contentFormat === 'lexical' ? state.content : undefined,
      contentFormat: state.contentFormat,
      coordinates: parseCoordinates(state),
      draftId,
      images: buildWriteImages(state),
      isPublished: state.isPublished,
      location: state.location || null,
      meta: state.meta,
      mood: state.mood || undefined,
      password: state.passwordProtected
        ? state.password.trim() || undefined
        : null,
      publicAt: normalizeFutureDatetimeIso(state.publicAt),
      slug: state.slug || undefined,
      text: state.text,
      title: resolveWriteTitle(kind, state),
      topicId: state.topicId || null,
      weather: state.weather || undefined,
    }

    return id ? updateNote(id, data) : createNote(data)
  }

  const data = {
    content: state.contentFormat === 'lexical' ? state.content : undefined,
    contentFormat: state.contentFormat,
    draftId,
    images: buildWriteImages(state),
    meta: state.meta,
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
    content: state.contentFormat === 'lexical' ? state.content : undefined,
    contentFormat: state.contentFormat,
    images: buildWriteImages(state),
    meta: state.meta,
    refId,
    refType: draftRefTypeByKind[kind],
    text: state.text,
    title: resolveWriteTitle(kind, state),
  } satisfies CreateDraftData

  if (kind === 'post') {
    return {
      ...base,
      typeSpecificData: {
        categoryId: state.categoryId,
        copyright: state.copyright,
        isPublished: state.isPublished,
        pin: state.pin ? new Date().toISOString() : null,
        pinOrder: state.pin ? Number(state.pinOrder) || 1 : undefined,
        relatedId: splitCommaList(state.relatedId),
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
        bookmark: state.bookmark,
        coordinates: parseCoordinates(state),
        location: state.location,
        mood: state.mood,
        password: state.passwordProtected ? state.password || '' : null,
        passwordProtected: state.passwordProtected,
        publicAt: normalizeFutureDatetimeIso(state.publicAt),
        slug: state.slug,
        topicId: state.topicId || null,
        weather: state.weather,
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
  agentVisible?: boolean
  autoFocus?: boolean
  content: string
  contentClassName?: string
  kind: WriteKind
  onContentChange: (content: string) => void
  onTextChange: (text: string) => void
  getMetaFields?: () => Record<string, unknown>
  metaFieldsSchema?: MetaFieldsSchema
  onMetaFieldsUpdate?: (
    updates: Record<string, unknown>,
  ) => Promise<void> | void
  refId?: string
  surfaceClassName?: string
  surfaceStyle?: CSSProperties
}) {
  const editorRef = useRef<RichEditorWithAgentRef | null>(null)
  const lexicalEditorRef = useRef<LexicalEditor | null>(null)
  const agentLoopRef = useRef<AgentLoopHandle | null>(null)
  const agentStoreRef = useRef<AgentStore | null>(null)
  if (!agentStoreRef.current) {
    agentStoreRef.current = createManagedAgentStore()
  }
  const agentStore = agentStoreRef.current
  const [selectedModel, setSelectedModel] =
    useLocalStorageState<SelectedAgentModel | null>(
      'agent-chat:selected-model',
      null,
    )
  const [agentSnapshot, setAgentSnapshot] = useState(() =>
    agentStore.getState(),
  )
  const [agentInput, setAgentInput] = useState('')
  const [agentReady, setAgentReady] = useState(false)
  const latestCallbacks = useRef({
    onContentChange: props.onContentChange,
    onTextChange: props.onTextChange,
  })
  const modelsQuery = useQuery({
    enabled: Boolean(props.agentVisible),
    queryFn: getModels,
    queryKey: ['ai', 'models', 'write-agent'],
  })
  const providerGroups = modelsQuery.data ?? []
  const provider = useMemo<LLMProvider | null>(() => {
    if (!selectedModel) return null

    return createProvider({
      model: selectedModel.modelId,
      providerType: mapAgentProviderType(selectedModel.providerType),
      transport: createAdminAgentTransport(selectedModel.providerId),
    })
  }, [selectedModel])
  const abortAgent = () => {
    agentLoopRef.current?.abort()
    agentStore.getState().setStatus('idle')
  }
  const sessionManager = useAgentSessionManager({
    abort: abortAgent,
    getModel: () => selectedModel?.modelId ?? '',
    getProviderId: () => selectedModel?.providerId ?? '',
    refId: props.refId,
    refType: props.kind,
    store: agentStore,
  })

  latestCallbacks.current = {
    onContentChange: props.onContentChange,
    onTextChange: props.onTextChange,
  }

  useEffect(() => {
    return agentStore.subscribe((snapshot) => setAgentSnapshot(snapshot))
  }, [agentStore])

  useEffect(() => {
    if (!providerGroups.length) return
    if (isSelectedAgentModelAvailable(selectedModel, providerGroups)) return

    const firstProvider = providerGroups.find(
      (group) => group.models.length > 0,
    )
    const firstModel = firstProvider?.models[0]
    if (!firstProvider || !firstModel) {
      setSelectedModel(null)
      return
    }

    setSelectedModel({
      modelId: firstModel.id,
      providerId: firstProvider.providerId,
      providerType: firstProvider.providerType,
    })
  }, [providerGroups, selectedModel, setSelectedModel])

  const editorStyle = {
    maxWidth: '100%',
    ...props.surfaceStyle,
  } satisfies Record<string, string | number>
  const editorOptions: RichEditorWithAgentProps = {
    apiUrl: API_URL,
    autoFocus: props.autoFocus ?? false,
    className: cn(
      'min-h-136 bg-white dark:bg-neutral-950',
      props.surfaceClassName,
    ),
    contentClassName: cn('min-h-120 px-4 py-3', props.contentClassName),
    debounceMs: 250,
    editorStyle,
    imageUpload: async (file) => {
      const result = await uploadFile(file, 'image')
      return { src: result.url }
    },
    initialValue: parseSerializedEditorState(props.content),
    systemMessages: props.metaFieldsSchema
      ? buildMetaSystemMessages(props.metaFieldsSchema)
      : undefined,
    tools:
      props.metaFieldsSchema && props.getMetaFields && props.onMetaFieldsUpdate
        ? buildMetaTools({
            getFields: props.getMetaFields,
            schema: props.metaFieldsSchema,
            setFields: props.onMetaFieldsUpdate,
          })
        : undefined,
    onAgentLoopReady: (loop) => {
      agentLoopRef.current = loop
      setAgentReady(Boolean(loop))
    },
    onChange: (value) => {
      latestCallbacks.current.onContentChange(JSON.stringify(value))
    },
    onEditorReady: (editor) => {
      lexicalEditorRef.current = editor
    },
    onTextChange: (text) => {
      latestCallbacks.current.onTextChange(text)
    },
    placeholder: '输入正文...',
    provider,
    saveExcalidrawSnapshot,
    store: agentStore,
    theme: getColorScheme(),
    variant: props.kind === 'note' ? 'note' : 'article',
  }

  useEffect(
    () => () => {
      agentLoopRef.current = null
      setAgentReady(false)
      lexicalEditorRef.current = null
    },
    [],
  )

  const sendAgentMessage = () => {
    const message = agentInput.trim()
    if (!message) return
    if (!selectedModel || !provider) {
      toast.error('请先选择 AI 模型')
      return
    }
    if (!agentLoopRef.current) {
      toast.error('AI 助手尚未就绪')
      return
    }

    setAgentInput('')
    agentStore.getState().addBubble({ content: message, type: 'user' })
    agentLoopRef.current.run(message).catch((error: unknown) => {
      if ((error as Error).name === 'AbortError') return
      const message = error instanceof Error ? error.message : String(error)
      agentStore.getState().addBubble({ message, type: 'error' })
      agentStore.getState().setStatus('idle')
    })
  }

  const retryAgent = () => {
    const lastUserBubble = [...agentStore.getState().bubbles]
      .reverse()
      .find((bubble) => bubble.type === 'user')
    if (lastUserBubble?.type !== 'user') return
    setAgentInput(lastUserBubble.content)
  }

  const applyBatch = (batchId: string, mode: 'accept' | 'reapply') => {
    const batch = agentStore
      .getState()
      .reviewState?.batches.find((item) => item.id === batchId)
    const editor = lexicalEditorRef.current
    if (!batch || !editor) return

    const apply = async () => {
      const { applyAgentReviewBatch } =
        await import('~/rich-editor/utils/apply-agent-review-batch')
      applyAgentReviewBatch(editor, batch)
      if (mode === 'accept') agentStore.getState().acceptReviewBatch(batchId)
      toast.success(mode === 'accept' ? '建议已应用' : '建议已重新应用')
    }

    void apply().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : '应用建议失败')
    })
  }

  const rejectBatch = (batchId: string) => {
    agentStore.getState().rejectReviewBatch(batchId)
  }

  const reapplyToolItems = (items: ToolCallGroupItem[]) => {
    const editor = lexicalEditorRef.current
    if (!editor) {
      toast.error('编辑器尚未就绪')
      return
    }

    const operations = items
      .map(extractAgentOperationFromToolItem)
      .filter((op): op is AgentOperation => Boolean(op))
    if (operations.length === 0) {
      toast.error('没有可重新应用的工具结果')
      return
    }

    const apply = async () => {
      const { applyAgentOperation } =
        await import('~/rich-editor/utils/apply-agent-review-batch')
      const summary = {
        conflict: 0,
        error: 0,
        success: 0,
      }

      for (const operation of operations) {
        const result = applyAgentOperation(editor, operation)
        summary[result.status] += 1
      }

      if (summary.error || summary.conflict) {
        toast.warning(
          `重新应用完成：成功 ${summary.success}，冲突 ${summary.conflict}，失败 ${summary.error}`,
        )
        return
      }

      toast.success(`已重新应用 ${summary.success} 项工具结果`)
    }

    void apply().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : '重新应用失败')
    })
  }

  return (
    <>
      <Suspense
        fallback={<RichEditorFallback className={editorOptions.className} />}
      >
        <RichEditorWithAgent ref={editorRef} {...editorOptions} />
      </Suspense>
      <ContentLayoutSlot active={Boolean(props.agentVisible)} id="agent">
        <WriteAgentPanel
          activeSessionId={sessionManager.activeSessionId}
          agentReady={agentReady}
          bubbles={agentSnapshot.bubbles}
          isHydrating={sessionManager.isHydrating}
          input={agentInput}
          isLoadingSessions={sessionManager.isLoading}
          isLoadingModels={modelsQuery.isLoading}
          loadSessionsError={sessionManager.loadError}
          onAbort={abortAgent}
          onAcceptBatch={(batchId) => applyBatch(batchId, 'accept')}
          onChangeInput={setAgentInput}
          onCreateSession={sessionManager.createSession}
          onDeleteSession={sessionManager.deleteSession}
          onRenameSession={sessionManager.renameSession}
          onRejectBatch={rejectBatch}
          onReapplyBatch={(batchId) => applyBatch(batchId, 'reapply')}
          onReapplyToolGroup={reapplyToolItems}
          onRetryLoadSessions={sessionManager.loadSessions}
          onRetry={retryAgent}
          onSelectModel={setSelectedModel}
          onSend={sendAgentMessage}
          onSwitchSession={sessionManager.switchSession}
          providerGroups={providerGroups}
          reviewState={agentSnapshot.reviewState}
          selectedModel={selectedModel}
          sessions={sessionManager.sessions}
          status={agentSnapshot.status}
        />
      </ContentLayoutSlot>
    </>
  )
}

function RichEditorFallback(props: { className?: string }) {
  return (
    <div
      className={cn(
        'min-h-136 bg-white px-4 py-3 dark:bg-neutral-950',
        props.className,
      )}
    >
      <div className="h-32 animate-pulse bg-neutral-100 dark:bg-neutral-900" />
    </div>
  )
}

type AgentProviderGroup = Awaited<ReturnType<typeof getModels>>[number]

interface SelectedAgentModel {
  modelId: string
  providerId: string
  providerType: string
}

function isSelectedAgentModelAvailable(
  model: SelectedAgentModel | null,
  providerGroups: AgentProviderGroup[],
) {
  if (!model) return false
  const provider = providerGroups.find(
    (group) => group.providerId === model.providerId,
  )

  return Boolean(provider?.models.some((item) => item.id === model.modelId))
}

function WriteAgentPanel(props: {
  activeSessionId: null | string
  agentReady: boolean
  bubbles: ChatBubble[]
  input: string
  isHydrating: boolean
  isLoadingModels: boolean
  isLoadingSessions: boolean
  loadSessionsError: boolean
  onAbort: () => void
  onAcceptBatch: (batchId: string) => void
  onChangeInput: (value: string) => void
  onCreateSession: () => void
  onDeleteSession: (sessionId: string) => void
  onRenameSession: (sessionId: string, title: string) => void
  onRejectBatch: (batchId: string) => void
  onReapplyBatch: (batchId: string) => void
  onReapplyToolGroup: (items: ToolCallGroupItem[]) => void
  onRetry: () => void
  onRetryLoadSessions: () => void
  onSelectModel: (model: SelectedAgentModel | null) => void
  onSend: () => void
  onSwitchSession: (sessionId: string) => void
  providerGroups: AgentProviderGroup[]
  reviewState: ReviewState | null
  selectedModel: SelectedAgentModel | null
  sessions: AgentSessionMeta[]
  status: AgentStoreSlice['status']
}) {
  const modelOptions = props.providerGroups.flatMap((group) =>
    group.models.map((model) => ({
      label: `${group.providerName} / ${model.name || model.id}`,
      modelId: model.id,
      providerId: group.providerId,
      providerType: group.providerType,
      value: `${group.providerId}:${model.id}`,
    })),
  )
  const selectedValue = props.selectedModel
    ? `${props.selectedModel.providerId}:${props.selectedModel.modelId}`
    : ''
  const isRunning =
    props.status !== 'idle' && props.status !== 'done' && props.status !== null
  const activeSession = props.sessions.find(
    (session) => session.id === props.activeSessionId,
  )
  const canSend =
    !isRunning &&
    props.agentReady &&
    Boolean(props.selectedModel) &&
    Boolean(props.input.trim())
  const [editingSession, setEditingSession] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')

  useEffect(() => {
    setEditingSession(false)
    setSessionTitle(activeSession?.title ?? '')
  }, [activeSession?.id, activeSession?.title])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (canSend) props.onSend()
  }

  const finishRename = () => {
    if (!props.activeSessionId) return
    setEditingSession(false)
    props.onRenameSession(props.activeSessionId, sessionTitle)
  }

  return (
    <AsidePanel>
      <div className="grid gap-2 border-b border-neutral-200 p-2 dark:border-neutral-800">
        {props.loadSessionsError ? (
          <button
            className="flex h-8 items-center gap-1.5 border border-red-200 bg-red-50 px-2 text-left text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            onClick={props.onRetryLoadSessions}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="size-3.5" />
            会话加载失败，点击重试
          </button>
        ) : null}

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
          {editingSession ? (
            <input
              autoFocus
              className="outline-hidden h-8 min-w-0 border border-neutral-200 bg-white px-2 text-xs text-neutral-700 focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
              onBlur={finishRename}
              onChange={(event) => setSessionTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  finishRename()
                }
                if (event.key === 'Escape') {
                  setEditingSession(false)
                  setSessionTitle(activeSession?.title ?? '')
                }
              }}
              placeholder="对话标题"
              value={sessionTitle}
            />
          ) : (
            <select
              className="outline-hidden h-8 min-w-0 border border-neutral-200 bg-white px-2 text-xs text-neutral-700 focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
              disabled={props.isLoadingSessions || props.sessions.length === 0}
              onChange={(event) => {
                if (event.target.value)
                  props.onSwitchSession(event.target.value)
              }}
              value={props.activeSessionId ?? ''}
            >
              {props.sessions.length === 0 ? (
                <option value="">
                  {props.isLoadingSessions ? '加载对话中...' : '新对话'}
                </option>
              ) : null}
              {props.sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {(session.title || '未命名对话') +
                    ` · ${formatDateTime(session.updatedAt)} · ${session.messageCount} 条`}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1">
            <button
              className="inline-flex size-8 items-center justify-center border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
              onClick={props.onCreateSession}
              title="新建对话"
              type="button"
            >
              <Plus aria-hidden="true" className="size-3.5" />
            </button>
            <button
              className="inline-flex size-8 items-center justify-center border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800 disabled:pointer-events-none disabled:opacity-40 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
              disabled={!props.activeSessionId || editingSession}
              onClick={() => setEditingSession(true)}
              title="重命名对话"
              type="button"
            >
              <Pencil aria-hidden="true" className="size-3.5" />
            </button>
            <button
              className="inline-flex size-8 items-center justify-center border border-neutral-200 text-neutral-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-300"
              disabled={!props.activeSessionId}
              onClick={() => {
                if (props.activeSessionId) {
                  props.onDeleteSession(props.activeSessionId)
                }
              }}
              title="删除对话"
              type="button"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
            </button>
            <button
              className="inline-flex size-8 items-center justify-center border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
              onClick={props.onRetry}
              title="重试上一条"
              type="button"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        </div>

        <select
          className="outline-hidden h-8 w-full border border-neutral-200 bg-white px-2 text-xs text-neutral-700 focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
          disabled={props.isLoadingModels || modelOptions.length === 0}
          onChange={(event) => {
            const option = modelOptions.find(
              (item) => item.value === event.target.value,
            )
            props.onSelectModel(
              option
                ? {
                    modelId: option.modelId,
                    providerId: option.providerId,
                    providerType: option.providerType,
                  }
                : null,
            )
          }}
          value={selectedValue}
        >
          {modelOptions.length === 0 ? (
            <option value="">
              {props.isLoadingModels ? '加载模型中...' : '未配置模型'}
            </option>
          ) : null}
          {modelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Scroll className="min-h-0 flex-1" innerClassName="p-3">
        {props.isHydrating ? (
          <div className="flex h-28 items-center justify-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            正在恢复对话
          </div>
        ) : props.bubbles.length === 0 ? (
          <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            可让 AI
            针对当前编辑器内容生成修改建议。建议会先进入审阅状态，确认后再写回正文。
          </p>
        ) : (
          <div className="space-y-3">
            {props.bubbles.map((bubble, index) => (
              <AgentBubbleView
                bubble={bubble}
                getBatch={(batchId) =>
                  props.reviewState?.batches.find(
                    (batch) => batch.id === batchId,
                  )
                }
                key={getAgentBubbleKey(bubble, index)}
                onAcceptBatch={props.onAcceptBatch}
                onRejectBatch={props.onRejectBatch}
                onReapplyBatch={props.onReapplyBatch}
                onReapplyToolGroup={props.onReapplyToolGroup}
              />
            ))}
          </div>
        )}
      </Scroll>

      <form
        className="grid shrink-0 gap-2 border-t border-neutral-200 p-2 dark:border-neutral-800"
        onSubmit={submit}
      >
        <textarea
          className="outline-hidden min-h-20 resize-y border border-neutral-200 bg-white px-2 py-1.5 text-sm leading-5 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
          onChange={(event) => props.onChangeInput(event.target.value)}
          placeholder="输入修改要求..."
          value={props.input}
        />
        <div className="flex items-center justify-end gap-2">
          <Button
            disabled={!isRunning}
            onClick={props.onAbort}
            type="button"
            variant="subtle"
          >
            中止
          </Button>
          <Button disabled={!canSend} type="submit">
            <Send aria-hidden="true" className="size-4" />
            {props.agentReady ? '发送' : '初始化中'}
          </Button>
        </div>
      </form>
    </AsidePanel>
  )
}

function AgentBubbleView(props: {
  bubble: ChatBubble
  getBatch: (batchId: string) => ReviewBatch | undefined
  onAcceptBatch: (batchId: string) => void
  onRejectBatch: (batchId: string) => void
  onReapplyBatch: (batchId: string) => void
  onReapplyToolGroup: (items: ToolCallGroupItem[]) => void
}) {
  const { bubble } = props

  if (bubble.type === 'diff_review') {
    const batch = props.getBatch(bubble.batchId)
    if (!batch) return null

    const pending = batch.entries.filter(
      (entry) => entry.status === 'pending',
    ).length
    const accepted = batch.entries.filter(
      (entry) => entry.status === 'accepted',
    ).length
    const rejected = batch.entries.filter(
      (entry) => entry.status === 'rejected',
    ).length

    return (
      <div className="border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="text-xs font-medium text-neutral-800 dark:text-neutral-100">
          修改建议
        </div>
        <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          待确认 {pending} · 已应用 {accepted} · 已拒绝 {rejected}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            className="h-7 border border-neutral-900 bg-neutral-900 px-2 text-xs text-white disabled:opacity-50 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
            disabled={pending === 0}
            onClick={() => props.onAcceptBatch(batch.id)}
            type="button"
          >
            应用
          </button>
          <button
            className="h-7 border border-neutral-200 bg-white px-2 text-xs text-neutral-700 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
            disabled={pending === 0}
            onClick={() => props.onRejectBatch(batch.id)}
            type="button"
          >
            拒绝
          </button>
          <button
            className="h-7 border border-neutral-200 bg-white px-2 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
            onClick={() => props.onReapplyBatch(batch.id)}
            type="button"
          >
            重新应用
          </button>
        </div>
      </div>
    )
  }

  if (bubble.type === 'user') {
    return (
      <div className="ml-8 bg-neutral-900 px-2.5 py-2 text-xs leading-5 text-white dark:bg-neutral-100 dark:text-neutral-950">
        {bubble.content}
      </div>
    )
  }

  if (bubble.type === 'assistant') {
    return (
      <div className="mr-6 border border-neutral-200 px-2.5 py-2 text-xs leading-5 text-neutral-800 dark:border-neutral-800 dark:text-neutral-100">
        {bubble.content}
      </div>
    )
  }

  if (bubble.type === 'thinking') {
    return (
      <div className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
        {bubble.content || '思考中...'}
      </div>
    )
  }

  if (bubble.type === 'tool_call_group') {
    const replayable = bubble.items.filter(isReplayableToolItem).length
    return (
      <div className="border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300">
        <div>
          工具调用 {bubble.items.length} 项
          {replayable ? ` · 可重新应用 ${replayable} 项` : ''}
        </div>
        {replayable ? (
          <button
            className="mt-2 h-7 border border-neutral-200 bg-white px-2 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
            onClick={() => props.onReapplyToolGroup(bubble.items)}
            type="button"
          >
            重新应用
          </button>
        ) : null}
      </div>
    )
  }

  if (bubble.type === 'error') {
    return (
      <div className="border border-red-200 bg-red-50 px-2.5 py-2 text-xs leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
        {bubble.message}
      </div>
    )
  }

  if (bubble.type === 'tool_call') {
    return (
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        调用工具：{bubble.toolName}
      </div>
    )
  }

  if (bubble.type === 'tool_result') {
    return (
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        {bubble.summary}
      </div>
    )
  }

  if (bubble.type === 'diff_summary') {
    return (
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        已应用 {bubble.accepted} · 已拒绝 {bubble.rejected} · 待确认{' '}
        {bubble.pending}
      </div>
    )
  }

  return null
}

function getAgentBubbleKey(bubble: ChatBubble, index: number) {
  if (bubble.type === 'diff_review') return `diff:${bubble.batchId}`
  if (bubble.type === 'tool_call_group') return `tool-group:${bubble.id}`
  if (bubble.type === 'thinking' && bubble.id) return `thinking:${bubble.id}`
  return `${bubble.type}:${index}`
}

function isReplayableToolItem(item: ToolCallGroupItem) {
  if (item.status !== 'completed' || !item.result) return false
  try {
    const parsed = JSON.parse(item.result) as { op?: AgentOperation }
    return Boolean(parsed.op && isAgentOperation(parsed.op))
  } catch {
    return false
  }
}

function extractAgentOperationFromToolItem(item: ToolCallGroupItem) {
  if (!isReplayableToolItem(item) || !item.result) return null
  try {
    const parsed = JSON.parse(item.result) as { op?: AgentOperation }
    return parsed.op && isAgentOperation(parsed.op) ? parsed.op : null
  } catch {
    return null
  }
}

function isAgentOperation(op: AgentOperation) {
  return op.op === 'insert' || op.op === 'replace' || op.op === 'delete'
}

function createAdminAgentTransport(providerId: string): TransportAdapter {
  return async (messages, tools, model, signal) => {
    const response = await fetch(`${API_URL}/ai/agent/chat`, {
      body: JSON.stringify({ messages, model, providerId, tools }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-skip-translation': '1',
      },
      method: 'POST',
      signal,
    })

    if (!response.ok || !response.body) return response

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const first = await reader.read()

    if (first.done) {
      reader.releaseLock()
      return new Response(new ReadableStream(), {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      })
    }

    const firstText = decoder.decode(first.value, { stream: true })
    if (/(^|\n)event:\s*error/.test(firstText)) {
      let buffer = firstText
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
      }
      reader.releaseLock()
      throw new Error(extractSseErrorMessage(buffer))
    }

    const stream = new ReadableStream<Uint8Array>({
      cancel(reason) {
        reader.cancel(reason).catch(() => {})
      },
      async pull(controller) {
        try {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            return
          }

          const text = decoder.decode(value, { stream: true })
          if (/(^|\n)event:\s*error/.test(text)) {
            let buffer = text
            while (true) {
              const { done: d, value: v } = await reader.read()
              if (d) break
              buffer += decoder.decode(v, { stream: true })
            }
            controller.error(new Error(extractSseErrorMessage(buffer)))
            return
          }

          controller.enqueue(value)
        } catch (error) {
          controller.error(error)
        }
      },
      start(controller) {
        controller.enqueue(first.value)
      },
    })

    return new Response(stream, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    })
  }
}

function extractSseErrorMessage(buffer: string): string {
  const match = buffer.match(/data:\s*(\{[\s\S]*?\})\s*(?:\n|$)/)
  if (match) {
    try {
      const parsed = JSON.parse(match[1]) as { message?: string }
      if (parsed.message) return parsed.message
    } catch {
      // Fall through to a bounded raw message.
    }
  }
  return buffer.slice(0, 500) || 'Unknown SSE error'
}

function mapAgentProviderType(type: string): 'claude' | 'openai-compatible' {
  if (type === 'anthropic' || type === 'claude') return 'claude'
  return 'openai-compatible'
}

function createManagedAgentStore() {
  const store = createAgentStore()
  patchReviewStateActions(store)
  return store
}

function stripBlockIdFromSerializedNode<
  T extends { $?: Record<string, unknown>; children?: unknown[] },
>(node: T): T {
  if (!node || typeof node !== 'object') return node

  const next = { ...node } as T & {
    $?: Record<string, unknown>
    children?: unknown[]
  }

  if (next.$ && typeof next.$ === 'object') {
    const rest = { ...next.$ }
    delete rest.blockId
    if (Object.keys(rest).length === 0) delete next.$
    else next.$ = rest
  }

  if (Array.isArray(next.children)) {
    next.children = next.children.map((child) =>
      stripBlockIdFromSerializedNode(child as any),
    )
  }

  return next
}

function sanitizeReviewOperation(op: AgentOperation): AgentOperation {
  if (op.op === 'insert' || op.op === 'replace') {
    if (!op.node) return op
    return {
      ...op,
      node: stripBlockIdFromSerializedNode(op.node as any),
    }
  }

  return op
}

function sanitizeReviewBatch(batch: ReviewBatch): ReviewBatch {
  return {
    ...batch,
    entries: batch.entries.map((entry) => ({
      ...entry,
      op: sanitizeReviewOperation(entry.op),
    })),
  }
}

function sanitizeDiffState(diffState: DiffState | null): DiffState | null {
  if (!diffState) return diffState

  const entries = diffState.entries.map((entry) => ({
    ...entry,
    op: sanitizeReviewOperation(entry.op),
  }))

  return {
    ...diffState,
    entries,
    getByBlockId(blockId: string) {
      return entries.find((entry) => {
        if (entry.op.op === 'replace' || entry.op.op === 'delete') {
          return entry.op.blockId === blockId
        }
        if (entry.op.op === 'insert' && entry.op.position.type !== 'root') {
          return entry.op.position.blockId === blockId
        }
        return false
      })
    },
    getPending() {
      return entries.filter((entry) => entry.status === 'pending')
    },
  }
}

function sanitizeReviewState(
  reviewState: ReviewState | null,
): ReviewState | null {
  if (!reviewState) return reviewState

  return {
    ...reviewState,
    batches: reviewState.batches.map(sanitizeReviewBatch),
  }
}

function sanitizeStoreSlice(
  slice: AgentStoreSlice | Partial<AgentStoreSlice>,
): AgentStoreSlice | Partial<AgentStoreSlice> {
  const next = { ...slice }

  if ('diffState' in next) {
    next.diffState = sanitizeDiffState(next.diffState ?? null)
  }

  if ('reviewState' in next) {
    next.reviewState = sanitizeReviewState(next.reviewState ?? null)
  }

  return next
}

function patchReviewStateActions(store: AgentStore) {
  const state = store.getState()
  const setState = store.setState.bind(store)
  const addReviewBatch = state.addReviewBatch
  const setDiffState = state.setDiffState
  const setReviewState = state.setReviewState

  store.setState = ((partial, replace) => {
    if (typeof partial === 'function') {
      return setState(
        ((current) =>
          sanitizeStoreSlice(partial(current) as AgentStoreSlice)) as any,
        replace as any,
      )
    }

    return setState(
      sanitizeStoreSlice(partial as AgentStoreSlice),
      replace as any,
    )
  }) as typeof store.setState

  state.setDiffState = (diffState: DiffState | null) =>
    setDiffState(sanitizeDiffState(diffState))
  state.addReviewBatch = (batch: ReviewBatch) =>
    addReviewBatch(sanitizeReviewBatch(batch))
  state.setReviewState = (reviewState: ReviewState | null) =>
    setReviewState(sanitizeReviewState(reviewState))
}

function parseSerializedEditorState(
  content: string,
): SerializedEditorState | undefined {
  if (!content.trim()) return undefined

  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && 'root' in parsed) {
      return parsed as SerializedEditorState
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

function formatDateTime(value: string | null | undefined) {
  if (value == null || value === '') return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

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
  isEditing: boolean,
) {
  if (kind !== 'note' && !state.title.trim()) return '请输入标题'
  if (!state.text.trim()) return '请输入正文'
  if (kind !== 'note' && !state.slug.trim()) return '请输入 Slug'
  if (kind === 'post' && !state.categoryId) {
    return categories.length > 0 ? '请选择分类' : '请先创建分类'
  }
  if (kind === 'page' && state.order && Number.isNaN(Number(state.order))) {
    return '排序必须是数字'
  }
  if (kind === 'post' && state.pin && Number.isNaN(Number(state.pinOrder))) {
    return '置顶顺序必须是数字'
  }
  if (
    kind === 'note' &&
    state.passwordProtected &&
    !isEditing &&
    !state.password.trim()
  ) {
    return '请输入访问密码'
  }

  return null
}

function getWriteAgentMetaSchema(kind: WriteKind) {
  if (kind === 'post') return POST_META_SCHEMA
  if (kind === 'note') return NOTE_META_SCHEMA
  return PAGE_META_SCHEMA
}

function getWriteAgentMetaFields(kind: WriteKind, state: WriteFormState) {
  if (kind === 'post') {
    return {
      copyright: state.copyright,
      isPublished: state.isPublished,
      pin: state.pin,
      pinOrder: Number(state.pinOrder) || 0,
      slug: state.slug,
      summary: state.summary,
      tags: splitCommaList(state.tags),
      title: state.title,
    }
  }

  if (kind === 'note') {
    return {
      bookmark: state.bookmark,
      isPublished: state.isPublished,
      location: state.location,
      mood: state.mood,
      slug: state.slug,
      title: state.title,
      weather: state.weather,
    }
  }

  return {
    order: Number(state.order) || 0,
    slug: state.slug,
    subtitle: state.subtitle,
    title: state.title,
  }
}

function applyWriteAgentMetaUpdates(
  kind: WriteKind,
  state: WriteFormState,
  updates: Record<string, unknown>,
) {
  const next = { ...state }

  if ('title' in updates) next.title = String(updates.title ?? '')
  if ('slug' in updates) next.slug = String(updates.slug ?? '')

  if (kind === 'post') {
    if ('tags' in updates && Array.isArray(updates.tags)) {
      next.tags = updates.tags.map((tag) => String(tag)).join(', ')
    }
    if ('summary' in updates) next.summary = String(updates.summary ?? '')
    if ('copyright' in updates) next.copyright = Boolean(updates.copyright)
    if ('pin' in updates) {
      next.pin = Boolean(updates.pin)
      if (!next.pin) next.pinOrder = '0'
      else if (!next.pinOrder || Number(next.pinOrder) === 0)
        next.pinOrder = '1'
    }
    if ('pinOrder' in updates) {
      next.pinOrder = String(Number(updates.pinOrder ?? 0) || 0)
    }
    if ('isPublished' in updates) {
      next.isPublished = Boolean(updates.isPublished)
    }
  }

  if (kind === 'note') {
    if ('mood' in updates) next.mood = String(updates.mood ?? '')
    if ('weather' in updates) next.weather = String(updates.weather ?? '')
    if ('bookmark' in updates) next.bookmark = Boolean(updates.bookmark)
    if ('location' in updates) {
      next.location = updates.location == null ? '' : String(updates.location)
    }
    if ('isPublished' in updates) {
      next.isPublished = Boolean(updates.isPublished)
    }
  }

  if (kind === 'page') {
    if ('subtitle' in updates) next.subtitle = String(updates.subtitle ?? '')
    if ('order' in updates) {
      next.order = String(Number(updates.order ?? 0) || 0)
    }
  }

  return next
}

function resolveWriteTitle(kind: WriteKind, state: WriteFormState) {
  if (state.title.trim()) return state.title.trim()
  if (kind === 'note') return getDefaultNoteTitle()
  return state.title
}

function splitCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toggleListValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

function parseCoordinates(state: WriteFormState) {
  if (!state.coordinatesLat.trim() || !state.coordinatesLng.trim()) return null

  const latitude = Number(state.coordinatesLat)
  const longitude = Number(state.coordinatesLng)

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null

  return { latitude, longitude }
}

function toDatetimeLocalValue(value: Date | string | null | undefined) {
  if (!value) return ''

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

function normalizeFutureDatetimeIso(value: string) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return null

  return date.toISOString()
}

interface DateOffset {
  days?: number
  months?: number
}

function addDateOffset(date: Date, offset: DateOffset) {
  const next = new Date(date)
  if (offset.days) next.setDate(next.getDate() + offset.days)
  if (offset.months) next.setMonth(next.getMonth() + offset.months)
  return next
}

function getDefaultNoteTitle(date = new Date()) {
  return `记录 ${date.getFullYear()} 年第 ${getDayOfYear(date)} 天`
}

function buildNotePublicPath(
  state: Pick<WriteFormState, 'slug'>,
  note: NoteModel | undefined,
) {
  if (state.slug.trim()) {
    const date = note?.createdAt ? new Date(note.createdAt) : new Date()
    return `/notes/${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}/${state.slug.trim()}`
  }

  return note?.nid ? `/notes/${note.nid}` : ''
}

function buildPostPublicPath(
  state: Pick<WriteFormState, 'slug'>,
  category: CategoryModel | undefined,
) {
  if (!state.slug.trim() || !category?.slug) return ''
  return `/posts/${category.slug}/${state.slug.trim()}`
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
