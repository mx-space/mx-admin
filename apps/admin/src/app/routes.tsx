import {
  BellOff,
  BellRing,
  BookOpen,
  ChartLine,
  Clock,
  DatabaseZap,
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
  ListTodo,
  MessageSquare,
  Pencil,
  Quote,
  RadioTower,
  SearchCheck,
  Settings,
  Sparkles,
  SquareFunction,
  Terminal,
  Undo2,
  UserRound,
  Users,
  Webhook,
} from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'

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

export interface AppRoute {
  description: string
  element: ComponentType
  icon: LucideIcon
  path: string
  title: string
}

export const appRoutes: AppRoute[] = [
  {
    description: 'Runtime status and environment data.',
    element: DashboardPage,
    icon: Gauge,
    path: '/dashboard',
    title: 'Dashboard',
  },
  {
    description: 'Posts, publishing state, search, and article operations.',
    element: PostsPage,
    icon: FileText,
    path: '/posts',
    title: 'Posts',
  },
  {
    description: 'Create and edit posts in the React markdown writing surface.',
    element: PostWritePage,
    icon: Pencil,
    path: '/posts/edit',
    title: 'Write Post',
  },
  {
    description: 'Post categories, tags, and their associated articles.',
    element: CategoriesPage,
    icon: FolderOpen,
    path: '/posts/category',
    title: 'Categories',
  },
  {
    description: 'Notes, publication state, and public note links.',
    element: NotesPage,
    icon: BookOpen,
    path: '/notes',
    title: 'Notes',
  },
  {
    description: 'Create and edit notes in the React markdown writing surface.',
    element: NoteWritePage,
    icon: Pencil,
    path: '/notes/edit',
    title: 'Write Note',
  },
  {
    description: 'Note topics, metadata, and associated note references.',
    element: TopicsPage,
    icon: Hash,
    path: '/notes/topic',
    title: 'Topics',
  },
  {
    description: 'Static pages, ordering metadata, and public page links.',
    element: PagesPage,
    icon: File,
    path: '/pages',
    title: 'Pages',
  },
  {
    description: 'Create and edit static pages in the React writing surface.',
    element: PageWritePage,
    icon: Pencil,
    path: '/pages/edit',
    title: 'Write Page',
  },
  {
    description: 'Autosaved drafts, versions, and content recovery.',
    element: DraftsPage,
    icon: FileClock,
    path: '/drafts',
    title: 'Drafts',
  },
  {
    description: 'Comments, moderation, and reader-facing feedback.',
    element: CommentsPage,
    icon: MessageSquare,
    path: '/comments',
    title: 'Comments',
  },
  {
    description: 'Authenticated readers and provider identities.',
    element: ReadersPage,
    icon: Users,
    path: '/readers',
    title: 'Readers',
  },
  {
    description: 'Short quotes, sayings, and source metadata.',
    element: SaysPage,
    icon: Quote,
    path: '/says',
    title: 'Says',
  },
  {
    description: 'Short-form thoughts, links, and lightweight references.',
    element: RecentlyPage,
    icon: Clock,
    path: '/recently',
    title: 'Recently',
  },
  {
    description: 'Project portfolio entries and publication metadata.',
    element: ProjectsPage,
    icon: Folder,
    path: '/projects',
    title: 'Projects',
  },
  {
    description: 'Friend links, link review, and site health checks.',
    element: FriendsPage,
    icon: UserRound,
    path: '/friends',
    title: 'Friends',
  },
  {
    description: 'Uploaded files, orphan images, and comment image uploads.',
    element: FilesPage,
    icon: Files,
    path: '/files',
    title: 'Files',
  },
  {
    description: 'Uploaded images that are no longer attached to content.',
    element: OrphanFilesPage,
    icon: Image,
    path: '/files/orphans',
    title: 'Orphan Images',
  },
  {
    description: 'Reader comment image uploads and binding status.',
    element: CommentImagesPage,
    icon: Image,
    path: '/files/comment-images',
    title: 'Comment Images',
  },
  {
    description: 'Traffic metrics, paths, IP records, and visitor analysis.',
    element: AnalyzePage,
    icon: ChartLine,
    path: '/analyze',
    title: 'Analyze',
  },
  {
    description: 'AI task surfaces and enrichment workflows.',
    element: AiPage,
    icon: Sparkles,
    path: '/ai',
    title: 'AI',
  },
  {
    description: 'Owner profile, URL data, and system options.',
    element: SettingsPage,
    icon: Settings,
    path: '/setting',
    title: 'Settings',
  },
  {
    description: 'Email subscription status and subscriber management.',
    element: SubscribePage,
    icon: BellOff,
    path: '/extra-features/subscribe',
    title: 'Subscribe',
  },
  {
    description: 'Configuration snippets and serverless function source.',
    element: SnippetsPage,
    icon: SquareFunction,
    path: '/extra-features/snippets',
    title: 'Snippets',
  },
  {
    description: 'Outbound webhook endpoints and dispatch history.',
    element: WebhooksPage,
    icon: Webhook,
    path: '/extra-features/webhooks',
    title: 'Webhooks',
  },
  {
    description: 'Markdown import, parsing preview, and archive export.',
    element: MarkdownPage,
    icon: FileDown,
    path: '/extra-features/markdown',
    title: 'Markdown',
  },
  {
    description: 'Email template source and sample payloads.',
    element: TemplatePage,
    icon: FileCode2,
    path: '/extra-features/assets/template',
    title: 'Templates',
  },
  {
    description: 'Database backup archives and restore operations.',
    element: BackupPage,
    icon: Undo2,
    path: '/maintenance/backup',
    title: 'Backups',
  },
  {
    description: 'Scheduled task definitions, execution status, and logs.',
    element: CronPage,
    icon: ListTodo,
    path: '/maintenance/cron',
    title: 'Cron',
  },
  {
    description: 'Search document rows, rebuild controls, and index metadata.',
    element: SearchIndexPage,
    icon: SearchCheck,
    path: '/maintenance/search-index',
    title: 'Search Index',
  },
  {
    description: 'Cache, screenshots, probes, and derived content assets.',
    element: EnrichmentPage,
    icon: DatabaseZap,
    path: '/enrichment',
    title: 'Enrichment',
  },
  {
    description: 'React Sonner scenarios for status, loading, and actions.',
    element: ToastDebugPage,
    icon: BellRing,
    path: '/debug/toast',
    title: 'Toast Lab',
  },
  {
    description: 'Passkey registration and authentication diagnostics.',
    element: AuthnDebugPage,
    icon: KeyRound,
    path: '/debug/authn',
    title: 'Passkey Lab',
  },
  {
    description: 'Synthetic socket event payloads and dispatch checks.',
    element: EventsDebugPage,
    icon: RadioTower,
    path: '/debug/events',
    title: 'Event Lab',
  },
  {
    description: 'Serverless function execution and response diagnostics.',
    element: ServerlessDebugPage,
    icon: Terminal,
    path: '/debug/serverless',
    title: 'Function Lab',
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
  { element: AiPage, from: '/ai/summary' },
  { element: AiPage, from: '/ai/insights' },
  { element: AiPage, from: '/ai/translation' },
  { element: AiPage, from: '/ai/translation-entries' },
  { element: AiPage, from: '/ai/tasks' },
  { element: AiPage, from: '/ai/slug-backfill' },
]

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
