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
import { Navigate, Route, Routes, useLocation } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TranslationKey } from './i18n/types'

import { AiPage } from './views/ai-page'
import { AnalyzePage } from './views/analyze-page'
import { AuthnDebugPage } from './views/authn-debug-page'
import { BackupPage } from './views/backup-page'
import { CategoriesPage } from './views/categories-page'
import { CommentsPage } from './views/comments-page'
import { CronPage } from './views/cron-page'
import { DashboardPage } from './views/dashboard-page'
import { DraftsPage } from './views/drafts-page'
import { EnrichmentPage } from './views/enrichment-page'
import { EventsDebugPage } from './views/events-debug-page'
import {
  CommentImagesPage,
  FilesPage,
  OrphanFilesPage,
} from './views/files-page'
import { FriendsPage } from './views/friends-page'
import { LoginPage } from './views/login-page'
import { MarkdownPage } from './views/markdown-page'
import { NotesPage } from './views/notes-page'
import { PagesPage } from './views/pages-page'
import { PostsPage } from './views/posts-page'
import { ProjectsPage } from './views/projects-page'
import { ReadersPage } from './views/readers-page'
import { RecentlyPage } from './views/recently-page'
import { RichDebugPage } from './views/rich-debug-page'
import { SaysPage } from './views/says-page'
import { SearchIndexPage } from './views/search-index-page'
import { ServerlessDebugPage } from './views/serverless-debug-page'
import { SettingsPage } from './views/settings-page'
import { SetupApiPage } from './views/setup-api-page'
import { SetupPage } from './views/setup-page'
import { SnippetsPage } from './views/snippets-page'
import { SubscribePage } from './views/subscribe-page'
import { TemplatePage } from './views/template-page'
import { ToastDebugPage } from './views/toast-debug-page'
import { TopicsPage } from './views/topics-page'
import { WebhooksPage } from './views/webhooks-page'
import { NoteWritePage, PageWritePage, PostWritePage } from './views/write-page'

export interface SidebarNavRoute {
  descriptionKey: TranslationKey
  icon: LucideIcon
  matchPaths?: string[]
  path: string
  titleKey: TranslationKey
}

export interface AppRoute extends SidebarNavRoute {
  element: ComponentType
}

export interface SidebarNavNode {
  children?: SidebarNavNode[]
  route: SidebarNavRoute
}

export interface SidebarNavSection {
  items: SidebarNavNode[]
  titleKey?: TranslationKey
}

export const appRoutes: AppRoute[] = [
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
  {
    descriptionKey: 'routes.toastLab.description',
    element: ToastDebugPage,
    icon: BellRing,
    path: '/debug/toast',
    titleKey: 'routes.toastLab.title',
  },
  {
    descriptionKey: 'routes.passkeyLab.description',
    element: AuthnDebugPage,
    icon: KeyRound,
    path: '/debug/authn',
    titleKey: 'routes.passkeyLab.title',
  },
  {
    descriptionKey: 'routes.eventLab.description',
    element: EventsDebugPage,
    icon: RadioTower,
    path: '/debug/events',
    titleKey: 'routes.eventLab.title',
  },
  {
    descriptionKey: 'routes.functionLab.description',
    element: ServerlessDebugPage,
    icon: Terminal,
    path: '/debug/serverless',
    titleKey: 'routes.functionLab.title',
  },
  {
    descriptionKey: 'routes.richLab.description',
    element: RichDebugPage,
    icon: FileCode2,
    path: '/debug/rich',
    titleKey: 'routes.richLab.title',
  },
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
    items: [
      sidebarNode('/debug/toast'),
      sidebarNode('/debug/authn'),
      sidebarNode('/debug/events'),
      sidebarNode('/debug/serverless'),
      sidebarNode('/debug/rich'),
    ],
  },
]

const legacyRouteAliases: Array<{
  element?: ComponentType
  from: string
  to?: string
}> = [
  { from: '/posts/view', to: '/posts' },
  { from: '/notes/view', to: '/notes' },
  { from: '/pages/list', to: '/pages' },
  { from: '/files/list', to: '/files' },
  { from: '/maintenance/enrichment', to: '/enrichment' },
  { element: LegacyPageRedirect, from: '/page/*' },
  { element: LegacyExtraRedirect, from: '/extra/*' },
]

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
    <Routes>
      <Route element={<Navigate replace to="/dashboard" />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<SetupPage />} path="/setup" />
      <Route element={<SetupApiPage />} path="/setup-api" />
      {legacyRouteAliases.map((route) => {
        if (route.to) {
          return (
            <Route
              element={<Navigate replace to={route.to} />}
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
        <Route element={<route.element />} key={route.path} path={route.path} />
      ))}
      <Route element={<Navigate replace to="/dashboard" />} path="*" />
    </Routes>
  )
}
