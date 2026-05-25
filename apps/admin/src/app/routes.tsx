import {
  BellOff,
  BellRing,
  BookOpen,
  BookOpenText,
  ChartLine,
  Clock,
  DatabaseZap,
  Eye,
  File,
  FileClock,
  FileCode2,
  FileDown,
  Files,
  FileText,
  Folder,
  FolderOpen,
  Gauge,
  Hash,
  Image,
  KeyRound,
  Languages,
  Link,
  ListTodo,
  MessageSquare,
  Pencil,
  Quote,
  RadioTower,
  SearchCheck,
  Settings,
  Sparkles,
  SquareFunction,
  Telescope,
  Terminal,
  Undo2,
  UserRound,
  Users,
  Webhook,
} from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import type { ComponentType, LazyExoticComponent } from 'react'
import type { TranslationKey } from './i18n/types'

type RouteComponent = ComponentType | LazyExoticComponent<ComponentType>

const lazyView = <T extends ComponentType>(
  loader: () => Promise<{ default: T }>,
) => lazy(loader)

const AiPage = lazyView(() =>
  import('./views/ai-page').then((module) => ({ default: module.AiPage })),
)
const AnalyzePage = lazyView(() =>
  import('./views/analyze-page').then((module) => ({
    default: module.AnalyzePage,
  })),
)
const BackupPage = lazyView(() =>
  import('./views/backup-page').then((module) => ({
    default: module.BackupPage,
  })),
)
const CategoriesPage = lazyView(() =>
  import('./views/categories-page').then((module) => ({
    default: module.CategoriesPage,
  })),
)
const CommentsPage = lazyView(() =>
  import('./views/comments-page').then((module) => ({
    default: module.CommentsPage,
  })),
)
const CronPage = lazyView(() =>
  import('./views/cron-page').then((module) => ({ default: module.CronPage })),
)
const DashboardPage = lazyView(() =>
  import('./views/dashboard-page').then((module) => ({
    default: module.DashboardPage,
  })),
)
const DraftsPage = lazyView(() =>
  import('./views/drafts-page').then((module) => ({
    default: module.DraftsPage,
  })),
)
const EnrichmentPage = lazyView(() =>
  import('./views/enrichment-page').then((module) => ({
    default: module.EnrichmentPage,
  })),
)
const FilesPage = lazyView(() =>
  import('./views/files-page').then((module) => ({
    default: module.FilesPage,
  })),
)
const OrphanFilesPage = lazyView(() =>
  import('./views/files-page').then((module) => ({
    default: module.OrphanFilesPage,
  })),
)
const CommentImagesPage = lazyView(() =>
  import('./views/files-page').then((module) => ({
    default: module.CommentImagesPage,
  })),
)
const FriendsPage = lazyView(() =>
  import('./views/friends-page').then((module) => ({
    default: module.FriendsPage,
  })),
)
const LoginPage = lazyView(() =>
  import('./views/login-page').then((module) => ({
    default: module.LoginPage,
  })),
)
const MarkdownPage = lazyView(() =>
  import('./views/markdown-page').then((module) => ({
    default: module.MarkdownPage,
  })),
)
const NotesPage = lazyView(() =>
  import('./views/notes-page').then((module) => ({
    default: module.NotesPage,
  })),
)
const PagesPage = lazyView(() =>
  import('./views/pages-page').then((module) => ({
    default: module.PagesPage,
  })),
)
const PostsPage = lazyView(() =>
  import('./views/posts-page').then((module) => ({
    default: module.PostsPage,
  })),
)
const ProjectsPage = lazyView(() =>
  import('./views/projects-page').then((module) => ({
    default: module.ProjectsPage,
  })),
)
const ReadersPage = lazyView(() =>
  import('./views/readers-page').then((module) => ({
    default: module.ReadersPage,
  })),
)
const RecentlyPage = lazyView(() =>
  import('./views/recently-page').then((module) => ({
    default: module.RecentlyPage,
  })),
)
const SaysPage = lazyView(() =>
  import('./views/says-page').then((module) => ({ default: module.SaysPage })),
)
const SearchIndexPage = lazyView(() =>
  import('./views/search-index-page').then((module) => ({
    default: module.SearchIndexPage,
  })),
)
const SettingsPage = lazyView(() =>
  import('./views/settings-page').then((module) => ({
    default: module.SettingsPage,
  })),
)
const SetupApiPage = lazyView(() =>
  import('./views/setup-api-page').then((module) => ({
    default: module.SetupApiPage,
  })),
)
const SetupPage = lazyView(() =>
  import('./views/setup-page').then((module) => ({
    default: module.SetupPage,
  })),
)
const SnippetsPage = lazyView(() =>
  import('./views/snippets-page').then((module) => ({
    default: module.SnippetsPage,
  })),
)
const SubscribePage = lazyView(() =>
  import('./views/subscribe-page').then((module) => ({
    default: module.SubscribePage,
  })),
)
const TemplatePage = lazyView(() =>
  import('./views/template-page').then((module) => ({
    default: module.TemplatePage,
  })),
)
const TopicsPage = lazyView(() =>
  import('./views/topics-page').then((module) => ({
    default: module.TopicsPage,
  })),
)
const WebhooksPage = lazyView(() =>
  import('./views/webhooks-page').then((module) => ({
    default: module.WebhooksPage,
  })),
)
const PostWritePage = lazyView(() =>
  import('./views/write-page').then((module) => ({
    default: module.PostWritePage,
  })),
)
const NoteWritePage = lazyView(() =>
  import('./views/write-page').then((module) => ({
    default: module.NoteWritePage,
  })),
)
const PageWritePage = lazyView(() =>
  import('./views/write-page').then((module) => ({
    default: module.PageWritePage,
  })),
)

export interface SidebarNavRoute {
  descriptionKey: TranslationKey
  icon: LucideIcon
  matchPaths?: string[]
  path: string
  titleKey: TranslationKey
}

export interface AppRoute extends SidebarNavRoute {
  element: RouteComponent
}

export interface SidebarNavNode {
  children?: SidebarNavNode[]
  route: SidebarNavRoute
}

export interface SidebarNavSection {
  items: SidebarNavNode[]
  titleKey?: TranslationKey
}

type DebugRouteKey = 'authn' | 'events' | 'rich' | 'serverless' | 'toast'

const debugRouteModules = import.meta.glob<{ default: ComponentType }>(
  './views/debug/**/*.tsx',
)

const devRouteModules = import.meta.glob<{ default: ComponentType }>(
  './views/dev/**/*.tsx',
)

const debugRouteOrder: DebugRouteKey[] = [
  'toast',
  'authn',
  'events',
  'serverless',
  'rich',
]

const debugRouteMeta = {
  authn: {
    descriptionKey: 'routes.passkeyLab.description',
    icon: KeyRound,
    titleKey: 'routes.passkeyLab.title',
  },
  events: {
    descriptionKey: 'routes.eventLab.description',
    icon: RadioTower,
    titleKey: 'routes.eventLab.title',
  },
  rich: {
    descriptionKey: 'routes.richLab.description',
    icon: FileCode2,
    titleKey: 'routes.richLab.title',
  },
  serverless: {
    descriptionKey: 'routes.functionLab.description',
    icon: Terminal,
    titleKey: 'routes.functionLab.title',
  },
  toast: {
    descriptionKey: 'routes.toastLab.description',
    icon: BellRing,
    titleKey: 'routes.toastLab.title',
  },
} satisfies Record<DebugRouteKey, Omit<SidebarNavRoute, 'path'>>

function readGlobRouteName(modulePath: string, root: string) {
  const relativePath = modulePath
    .replace(root, '')
    .replace(/\.[jt]sx$/, '')
    .replace(/\/index$/, '')
  const name = relativePath.split('/').filter(Boolean).at(-1)

  return name || 'index'
}

const debugRoutes: AppRoute[] = Object.entries(debugRouteModules)
  .map(([modulePath, moduleLoader]) => {
    const name = readGlobRouteName(modulePath, './views/debug/')
    const knownMeta = debugRouteMeta[name as DebugRouteKey]

    return {
      descriptionKey: knownMeta?.descriptionKey ?? 'routes.debug.description',
      element: lazyView(moduleLoader),
      icon: knownMeta?.icon ?? Terminal,
      path: `/debug/${name}`,
      titleKey: knownMeta?.titleKey ?? 'routes.debug.title',
    } satisfies AppRoute
  })
  .sort((a, b) => {
    const aName = a.path.replace('/debug/', '') as DebugRouteKey
    const bName = b.path.replace('/debug/', '') as DebugRouteKey
    const aOrder = debugRouteOrder.indexOf(aName)
    const bOrder = debugRouteOrder.indexOf(bName)

    if (aOrder !== -1 || bOrder !== -1) {
      return (
        (aOrder === -1 ? Number.POSITIVE_INFINITY : aOrder) -
        (bOrder === -1 ? Number.POSITIVE_INFINITY : bOrder)
      )
    }

    return a.path.localeCompare(b.path)
  })

const devRoutes: AppRoute[] = import.meta.env.DEV
  ? Object.entries(devRouteModules).map(([modulePath, moduleLoader]) => {
      const name = readGlobRouteName(modulePath, './views/dev/')

      return {
        descriptionKey: 'routes.dev.description',
        element: lazyView(moduleLoader),
        icon: Terminal,
        path: `/dev/${name}`,
        titleKey: 'routes.dev.title',
      }
    })
  : []

const coreAppRoutes: AppRoute[] = [
  {
    descriptionKey: 'routes.dashboard.description',
    element: DashboardPage,
    icon: Gauge,
    path: '/dashboard',
    titleKey: 'routes.dashboard.title',
  },
  {
    descriptionKey: 'routes.posts.description',
    element: PostsPage,
    icon: FileText,
    path: '/posts',
    titleKey: 'routes.posts.title',
  },
  {
    descriptionKey: 'routes.writePost.description',
    element: PostWritePage,
    icon: Pencil,
    path: '/posts/edit',
    titleKey: 'routes.writePost.title',
  },
  {
    descriptionKey: 'routes.categories.description',
    element: CategoriesPage,
    icon: FolderOpen,
    path: '/posts/category',
    titleKey: 'routes.categories.title',
  },
  {
    descriptionKey: 'routes.notes.description',
    element: NotesPage,
    icon: BookOpen,
    path: '/notes',
    titleKey: 'routes.notes.title',
  },
  {
    descriptionKey: 'routes.writeNote.description',
    element: NoteWritePage,
    icon: Pencil,
    path: '/notes/edit',
    titleKey: 'routes.writeNote.title',
  },
  {
    descriptionKey: 'routes.topics.description',
    element: TopicsPage,
    icon: Hash,
    path: '/notes/topic',
    titleKey: 'routes.topics.title',
  },
  {
    descriptionKey: 'routes.pages.description',
    element: PagesPage,
    icon: File,
    path: '/pages',
    titleKey: 'routes.pages.title',
  },
  {
    descriptionKey: 'routes.writePage.description',
    element: PageWritePage,
    icon: Pencil,
    path: '/pages/edit',
    titleKey: 'routes.writePage.title',
  },
  {
    descriptionKey: 'routes.drafts.description',
    element: DraftsPage,
    icon: FileClock,
    path: '/drafts',
    titleKey: 'routes.drafts.title',
  },
  {
    descriptionKey: 'routes.comments.description',
    element: CommentsPage,
    icon: MessageSquare,
    path: '/comments',
    titleKey: 'routes.comments.title',
  },
  {
    descriptionKey: 'routes.readers.description',
    element: ReadersPage,
    icon: Users,
    path: '/readers',
    titleKey: 'routes.readers.title',
  },
  {
    descriptionKey: 'routes.says.description',
    element: SaysPage,
    icon: Quote,
    path: '/says',
    titleKey: 'routes.says.title',
  },
  {
    descriptionKey: 'routes.recently.description',
    element: RecentlyPage,
    icon: Clock,
    path: '/recently',
    titleKey: 'routes.recently.title',
  },
  {
    descriptionKey: 'routes.projects.description',
    element: ProjectsPage,
    icon: Folder,
    path: '/projects',
    titleKey: 'routes.projects.title',
  },
  {
    descriptionKey: 'routes.friends.description',
    element: FriendsPage,
    icon: UserRound,
    path: '/friends',
    titleKey: 'routes.friends.title',
  },
  {
    descriptionKey: 'routes.files.description',
    element: FilesPage,
    icon: Files,
    path: '/files',
    titleKey: 'routes.files.title',
  },
  {
    descriptionKey: 'routes.orphanImages.description',
    element: OrphanFilesPage,
    icon: Image,
    path: '/files/orphans',
    titleKey: 'routes.orphanImages.title',
  },
  {
    descriptionKey: 'routes.commentImages.description',
    element: CommentImagesPage,
    icon: Image,
    path: '/files/comment-images',
    titleKey: 'routes.commentImages.title',
  },
  {
    descriptionKey: 'routes.analyze.description',
    element: AnalyzePage,
    icon: ChartLine,
    path: '/analyze',
    titleKey: 'routes.analyze.title',
  },
  {
    descriptionKey: 'routes.ai.description',
    element: AiPage,
    icon: Sparkles,
    path: '/ai',
    titleKey: 'routes.ai.title',
  },
  {
    descriptionKey: 'routes.aiSummary.description',
    element: AiPage,
    icon: FileText,
    path: '/ai/summary',
    titleKey: 'routes.aiSummary.title',
  },
  {
    descriptionKey: 'routes.aiInsights.description',
    element: AiPage,
    icon: Telescope,
    path: '/ai/insights',
    titleKey: 'routes.aiInsights.title',
  },
  {
    descriptionKey: 'routes.aiTranslation.description',
    element: AiPage,
    icon: Languages,
    path: '/ai/translation',
    titleKey: 'routes.aiTranslation.title',
  },
  {
    descriptionKey: 'routes.aiTranslationEntries.description',
    element: AiPage,
    icon: BookOpenText,
    path: '/ai/translation-entries',
    titleKey: 'routes.aiTranslationEntries.title',
  },
  {
    descriptionKey: 'routes.aiTasks.description',
    element: AiPage,
    icon: ListTodo,
    path: '/ai/tasks',
    titleKey: 'routes.aiTasks.title',
  },
  {
    descriptionKey: 'routes.aiSlugBackfill.description',
    element: AiPage,
    icon: Link,
    path: '/ai/slug-backfill',
    titleKey: 'routes.aiSlugBackfill.title',
  },
  {
    descriptionKey: 'routes.settings.description',
    element: SettingsPage,
    icon: Settings,
    path: '/setting',
    titleKey: 'routes.settings.title',
  },
  {
    descriptionKey: 'routes.settings.description',
    element: SettingsPage,
    icon: Settings,
    path: '/setting/:tab',
    titleKey: 'routes.settings.title',
  },
  {
    descriptionKey: 'routes.subscribe.description',
    element: SubscribePage,
    icon: BellOff,
    path: '/extra-features/subscribe',
    titleKey: 'routes.subscribe.title',
  },
  {
    descriptionKey: 'routes.snippets.description',
    element: SnippetsPage,
    icon: SquareFunction,
    path: '/extra-features/snippets',
    titleKey: 'routes.snippets.title',
  },
  {
    descriptionKey: 'routes.webhooks.description',
    element: WebhooksPage,
    icon: Webhook,
    path: '/extra-features/webhooks',
    titleKey: 'routes.webhooks.title',
  },
  {
    descriptionKey: 'routes.markdown.description',
    element: MarkdownPage,
    icon: FileDown,
    path: '/extra-features/markdown',
    titleKey: 'routes.markdown.title',
  },
  {
    descriptionKey: 'routes.templates.description',
    element: TemplatePage,
    icon: FileCode2,
    path: '/extra-features/assets/template',
    titleKey: 'routes.templates.title',
  },
  {
    descriptionKey: 'routes.backups.description',
    element: BackupPage,
    icon: Undo2,
    path: '/maintenance/backup',
    titleKey: 'routes.backups.title',
  },
  {
    descriptionKey: 'routes.cron.description',
    element: CronPage,
    icon: ListTodo,
    path: '/maintenance/cron',
    titleKey: 'routes.cron.title',
  },
  {
    descriptionKey: 'routes.searchIndex.description',
    element: SearchIndexPage,
    icon: SearchCheck,
    path: '/maintenance/search-index',
    titleKey: 'routes.searchIndex.title',
  },
  {
    descriptionKey: 'routes.enrichment.description',
    element: EnrichmentPage,
    icon: DatabaseZap,
    path: '/enrichment',
    titleKey: 'routes.enrichment.title',
  },
]

export const appRoutes: AppRoute[] = [
  ...coreAppRoutes,
  ...debugRoutes,
  ...devRoutes,
]

function routeByPath(path: string) {
  const route = appRoutes.find((item) => item.path === path)
  if (!route) {
    throw new Error(`Missing admin route: ${path}`)
  }

  return route
}

function sidebarRoute(
  path: string,
  overrides: Partial<Omit<SidebarNavRoute, 'path'>> = {},
): SidebarNavRoute {
  return {
    ...routeByPath(path),
    ...overrides,
  }
}

function sidebarOnlyRoute(route: SidebarNavRoute): SidebarNavRoute {
  return route
}

function sidebarNode(
  path: string,
  overrides?: Partial<Omit<SidebarNavRoute, 'path'>>,
): SidebarNavNode {
  return { route: sidebarRoute(path, overrides) }
}

function sidebarAliasNode(
  path: string,
  targetPath: string,
  overrides?: Partial<Omit<SidebarNavRoute, 'path'>>,
): SidebarNavNode {
  const route = sidebarRoute(targetPath, overrides)

  return {
    route: {
      ...route,
      matchPaths: [...(route.matchPaths ?? []), targetPath],
      path,
    },
  }
}

function sidebarGroupNode(route: SidebarNavRoute, children: SidebarNavNode[]) {
  return {
    children,
    route: sidebarOnlyRoute(route),
  } satisfies SidebarNavNode
}

export const sidebarNavigation: SidebarNavSection[] = [
  {
    items: [{ route: routeByPath('/dashboard') }],
  },
  {
    titleKey: 'shell.nav.content',
    items: [
      sidebarGroupNode(routeByPath('/posts'), [
        sidebarAliasNode('/posts/view', '/posts', {
          descriptionKey: 'routes.managePosts.description',
          icon: Eye,
          titleKey: 'routes.managePosts.title',
        }),
        sidebarNode('/posts/edit'),
        sidebarNode('/posts/category'),
      ]),
      sidebarGroupNode(routeByPath('/notes'), [
        sidebarAliasNode('/notes/view', '/notes', {
          descriptionKey: 'routes.manageNotes.description',
          icon: Eye,
          titleKey: 'routes.manageNotes.title',
        }),
        sidebarNode('/notes/edit'),
        sidebarNode('/notes/topic'),
      ]),
      { route: routeByPath('/drafts') },
      sidebarGroupNode(routeByPath('/pages'), [
        sidebarAliasNode('/pages/list', '/pages', {
          descriptionKey: 'routes.managePages.description',
          icon: Eye,
          titleKey: 'routes.managePages.title',
        }),
        sidebarNode('/pages/edit'),
      ]),
      { route: routeByPath('/says') },
      { route: routeByPath('/recently') },
      { route: routeByPath('/projects') },
    ],
  },
  {
    titleKey: 'shell.nav.community',
    items: [
      { route: routeByPath('/comments') },
      { route: routeByPath('/readers') },
      { route: routeByPath('/friends') },
      sidebarNode('/extra-features/subscribe'),
    ],
  },
  {
    titleKey: 'shell.nav.assets',
    items: [
      sidebarGroupNode(routeByPath('/files'), [
        sidebarAliasNode('/files/list', '/files', {
          descriptionKey: 'routes.manageFiles.description',
          icon: Eye,
          titleKey: 'routes.manageFiles.title',
        }),
        sidebarNode('/files/orphans'),
        sidebarNode('/files/comment-images'),
      ]),
      sidebarNode('/extra-features/assets/template'),
      sidebarNode('/extra-features/markdown'),
    ],
  },
  {
    titleKey: 'shell.nav.system',
    items: [
      sidebarGroupNode(routeByPath('/ai'), [
        sidebarNode('/ai/summary'),
        sidebarNode('/ai/insights'),
        sidebarNode('/ai/translation'),
        sidebarNode('/ai/translation-entries'),
        sidebarNode('/ai/tasks'),
        sidebarNode('/ai/slug-backfill'),
      ]),
      { route: routeByPath('/analyze') },
      { route: routeByPath('/setting') },
    ],
  },
  {
    titleKey: 'shell.nav.extra',
    items: [
      sidebarNode('/extra-features/snippets'),
      sidebarNode('/extra-features/webhooks'),
    ],
  },
  {
    titleKey: 'shell.nav.maintenance',
    items: [
      sidebarNode('/maintenance/cron'),
      sidebarNode('/maintenance/backup'),
      sidebarAliasNode('/maintenance/enrichment', '/enrichment'),
      sidebarNode('/maintenance/search-index'),
    ],
  },
  {
    titleKey: 'shell.nav.debug',
    items: debugRoutes.map((route) => ({ route })),
  },
]

const legacyRouteAliases: Array<{
  element?: RouteComponent
  from: string
  to?: string
}> = [
  { from: '/posts/view', to: '/posts' },
  { from: '/notes/view', to: '/notes' },
  { from: '/pages/list', to: '/pages' },
  { from: '/files/list', to: '/files' },
  { from: '/maintenance/enrichment', to: '/enrichment' },
  { from: '/maintenance', to: '/maintenance/cron' },
  { from: '/extra-features', to: '/extra-features/snippets' },
  { from: '/ai', to: '/ai/summary' },
  { element: LegacyPageRedirect, from: '/page/*' },
  { element: LegacyExtraRedirect, from: '/extra/*' },
]

function LegacyStaticRedirect(props: { to: string }) {
  const location = useLocation()

  return (
    <Navigate replace to={`${props.to}${location.search}${location.hash}`} />
  )
}

function LegacyPageRedirect() {
  const location = useLocation()
  const nextPath = location.pathname.replace(/^\/page(?=\/|$)/, '/pages')

  return (
    <Navigate replace to={`${nextPath}${location.search}${location.hash}`} />
  )
}

function LegacyExtraRedirect() {
  const location = useLocation()
  const nextPath = location.pathname.replace(/^\/extra(?=\/|$)/, '')

  return (
    <Navigate
      replace
      to={`${nextPath || '/'}${location.search}${location.hash}`}
    />
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route element={<Navigate replace to="/dashboard" />} path="/" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<SetupPage />} path="/setup" />
        <Route element={<SetupApiPage />} path="/setup-api" />
        {legacyRouteAliases.map((route) => {
          if (route.to) {
            return (
              <Route
                element={<LegacyStaticRedirect to={route.to} />}
                key={route.from}
                path={route.from}
              />
            )
          }

          const Element = route.element
          return Element ? (
            <Route element={<Element />} key={route.from} path={route.from} />
          ) : null
        })}
        {appRoutes.map((route) => (
          <Route
            element={<route.element />}
            key={route.path}
            path={route.path}
          />
        ))}
        <Route element={<Navigate replace to="/dashboard" />} path="*" />
      </Routes>
    </Suspense>
  )
}

function RouteLoadingFallback() {
  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-white text-sm text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
      Loading...
    </div>
  )
}
