import type { TranslationKey } from '../types'

export const enUS = {
  'app.loading.auth': 'Checking sign-in state...',

  'auth.login.failed': 'Sign-in failed',
  'auth.login.github': 'Sign in with GitHub',
  'auth.login.google': 'Sign in with Google',
  'auth.login.loadingProfile': 'Loading authentication profile',
  'auth.login.ownerUsernameMissing': 'Owner username is unavailable',
  'auth.login.passkey': 'Sign in with Passkey',
  'auth.login.passkeyFailed': 'Passkey verification failed',
  'auth.login.passkeySucceeded': 'Passkey verification succeeded',
  'auth.login.passwordLabel': 'Password',
  'auth.login.passwordPlaceholder': 'Enter password',
  'auth.login.submit': 'Sign in',
  'auth.login.welcomeBack': 'Welcome back',

  'common.locale.en-US': 'English',
  'common.locale.zh-CN': 'Simplified Chinese',
  'common.openMainSite': 'Open main site',
  'common.pagination.nextPage': 'Next page',
  'common.pagination.pageSize': '{count} / page',
  'common.pagination.previousPage': 'Previous page',
  'common.primaryNavigation': 'Primary navigation',

  'routes.ai.description': 'AI task surfaces and enrichment workflows.',
  'routes.ai.title': 'AI',
  'routes.aiInsights.description':
    'AI insights, insight translations, and generation tasks.',
  'routes.aiInsights.title': 'Insights',
  'routes.aiSlugBackfill.description':
    'Backfill AI-generated slugs for existing content.',
  'routes.aiSlugBackfill.title': 'Slug Backfill',
  'routes.aiSummary.description':
    'AI summary results and batch generation status.',
  'routes.aiSummary.title': 'Summary',
  'routes.aiTasks.description':
    'AI background task queue, retry, and cancellation controls.',
  'routes.aiTasks.title': 'Task Queue',
  'routes.aiTranslation.description':
    'AI translation results and batch translation workflows.',
  'routes.aiTranslation.title': 'Translation',
  'routes.aiTranslationEntries.description':
    'AI translation glossary and terminology maintenance.',
  'routes.aiTranslationEntries.title': 'Glossary',
  'routes.analyze.description':
    'Traffic metrics, paths, IP records, and visitor analysis.',
  'routes.analyze.title': 'Analyze',
  'routes.backups.description':
    'Database backup archives and restore operations.',
  'routes.backups.title': 'Backups',
  'routes.categories.description':
    'Posts categories, tags, and their associated articles.',
  'routes.categories.title': 'Categories',
  'routes.commentImages.description':
    'Reader comment image uploads and binding status.',
  'routes.commentImages.title': 'Comment Images',
  'routes.comments.description':
    'Comments, moderation, and reader-facing feedback.',
  'routes.comments.title': 'Comments',
  'routes.cron.description':
    'Scheduled task definitions, execution status, and logs.',
  'routes.cron.title': 'Cron',
  'routes.dashboard.description': 'Runtime status and environment data.',
  'routes.dashboard.title': 'Dashboard',
  'routes.debug.description': 'Development and diagnostic tools.',
  'routes.debug.title': 'Debug Page',
  'routes.dev.description': 'Development-only auto-registered pages.',
  'routes.dev.title': 'Dev Page',
  'routes.drafts.description':
    'Autosaved drafts, versions, and content recovery.',
  'routes.drafts.title': 'Drafts',
  'routes.enrichment.description':
    'Cache, screenshots, probes, and derived content assets.',
  'routes.enrichment.title': 'Enrichment',
  'routes.eventLab.description':
    'Synthetic socket event payloads and dispatch checks.',
  'routes.eventLab.title': 'Event Lab',
  'routes.extraFeatures.description':
    'Subscription, webhook, template, and import/export tools.',
  'routes.files.description':
    'Uploaded files, orphan images, and comment image uploads.',
  'routes.files.title': 'Files',
  'routes.friends.description':
    'Friend links, link review, and site health checks.',
  'routes.friends.title': 'Friends',
  'routes.functionLab.description':
    'Serverless function execution and response diagnostics.',
  'routes.functionLab.title': 'Function Lab',
  'routes.markdown.description':
    'Markdown import, parsing preview, and archive export.',
  'routes.markdown.title': 'Markdown',
  'routes.maintenance.description':
    'Background maintenance tasks, backups, and search indexing.',
  'routes.manageFiles.description': 'Uploaded file list and file operations.',
  'routes.manageFiles.title': 'File Manager',
  'routes.manageNotes.description':
    'Note list, state filters, and batch operations.',
  'routes.manageNotes.title': 'Manage',
  'routes.managePages.description':
    'Static page list, ordering metadata, and page operations.',
  'routes.managePages.title': 'Manage',
  'routes.managePosts.description':
    'Post list, state filters, and batch operations.',
  'routes.managePosts.title': 'Manage',
  'routes.notes.description':
    'Notes, publication state, and public note links.',
  'routes.notes.title': 'Notes',
  'routes.orphanImages.description':
    'Uploaded images that are no longer attached to content.',
  'routes.orphanImages.title': 'Orphan Images',
  'routes.pages.description':
    'Static pages, ordering metadata, and public page links.',
  'routes.pages.title': 'Pages',
  'routes.passkeyLab.description':
    'Passkey registration and authentication diagnostics.',
  'routes.passkeyLab.title': 'Passkey Lab',
  'routes.posts.description':
    'Posts, publishing state, search, and article operations.',
  'routes.posts.title': 'Posts',
  'routes.projects.description':
    'Project portfolio entries and publication metadata.',
  'routes.projects.title': 'Projects',
  'routes.readers.description':
    'Authenticated readers and provider identities.',
  'routes.readers.title': 'Readers',
  'routes.recently.description':
    'Short-form thoughts, links, and lightweight references.',
  'routes.recently.title': 'Recently',
  'routes.richLab.description':
    'Rich editor mounting, upload, and serialized content diagnostics.',
  'routes.richLab.title': 'Rich Lab',
  'routes.says.description': 'Short quotes, sayings, and source metadata.',
  'routes.says.title': 'Says',
  'routes.searchIndex.description':
    'Search document rows, rebuild controls, and index metadata.',
  'routes.searchIndex.title': 'Search Index',
  'routes.settings.description': 'Owner profile, URL data, and system options.',
  'routes.settings.title': 'Settings',
  'routes.snippets.description':
    'Configuration snippets and serverless function source.',
  'routes.snippets.title': 'Snippets',
  'routes.subscribe.description':
    'Email subscription status and subscriber management.',
  'routes.subscribe.title': 'Subscribe',
  'routes.templates.description': 'Email template source and sample payloads.',
  'routes.templates.title': 'Templates',
  'routes.toastLab.description':
    'React Sonner scenarios for status, loading, and actions.',
  'routes.toastLab.title': 'Toast Lab',
  'routes.topics.description':
    'Note topics, metadata, and associated note references.',
  'routes.topics.title': 'Topics',
  'routes.webhooks.description':
    'Outbound webhook endpoints and dispatch history.',
  'routes.webhooks.title': 'Webhooks',
  'routes.writeNote.description':
    'Create and edit notes in the React markdown writing surface.',
  'routes.writeNote.title': 'Write Note',
  'routes.writePage.description':
    'Create and edit static pages in the React writing surface.',
  'routes.writePage.title': 'Write Page',
  'routes.writePost.description':
    'Create and edit posts in the React markdown writing surface.',
  'routes.writePost.title': 'Write Post',

  'shell.footer.runtime': 'React admin runtime.',
  'shell.locale.label': 'Interface language',
  'shell.logout': 'Sign out',
  'shell.nav.assets': 'Assets',
  'shell.nav.assets.description':
    'Files, templates, and import/export resources.',
  'shell.nav.community': 'Community',
  'shell.nav.community.description':
    'Comments, readers, friend links, and subscriptions.',
  'shell.nav.content': 'Content',
  'shell.nav.content.description':
    'Posts, notes, pages, and editorial entries.',
  'shell.nav.debug': 'Debug',
  'shell.nav.extra': 'Extensions',
  'shell.nav.maintenance': 'Maintenance',
  'shell.nav.system': 'System',
  'shell.nav.system.description':
    'AI, analytics, settings, and background maintenance.',
  'shell.owner.fallback': 'User',
  'shell.theme.dark': 'Dark',
  'shell.theme.label': 'Theme',
  'shell.theme.light': 'Light',
  'shell.theme.system': 'System',
} satisfies Record<TranslationKey, string>
