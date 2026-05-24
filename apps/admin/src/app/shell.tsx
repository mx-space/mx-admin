import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import type { PropsWithChildren } from 'react'
import type { Locale, TranslationKey } from './i18n/types'
import type { SidebarNavNode, SidebarNavRoute } from './routes'
import type { ThemeMode } from './theme'

import { getOwner } from './api/options'
import { getAppInfo } from './api/system'
import { API_URL, GATEWAY_URL, WEB_URL } from './constants/env'
import { SESSION_WITH_LOGIN } from './constants/keys'
import { useI18n } from './i18n'
import { SUPPORTED_LOCALES } from './i18n/resources'
import { appRoutes, sidebarNavigation } from './routes'
import { useThemeMode } from './theme'
import { cn } from './ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from './ui/layout'
import { SelectField } from './ui/select'
import { authClient } from './utils/authjs/auth'

const activeLinkClassName =
  'bg-neutral-950 text-white shadow-sm dark:bg-neutral-50 dark:text-neutral-950'
const inactiveLinkClassName =
  'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-50'
const localeLabelKeys = {
  'en-US': 'common.locale.en-US',
  'zh-CN': 'common.locale.zh-CN',
} satisfies Record<Locale, TranslationKey>
const themeModeLabelKeys = {
  dark: 'shell.theme.dark',
  light: 'shell.theme.light',
  system: 'shell.theme.system',
} satisfies Record<ThemeMode, TranslationKey>
const themeModeOptions: Array<{
  icon: typeof Sun
  value: ThemeMode
}> = [
  { icon: Sun, value: 'light' },
  { icon: Moon, value: 'dark' },
  { icon: Monitor, value: 'system' },
]

export function AdminShell(props: PropsWithChildren) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { locale, setLocale, t } = useI18n()
  const { setThemeMode, themeMode } = useThemeMode()
  const ownerQuery = useQuery({
    queryFn: getOwner,
    queryKey: ['shell', 'owner'],
    retry: false,
  })
  const appInfoQuery = useQuery({
    queryFn: getAppInfo,
    queryKey: ['shell', 'app-info'],
    retry: false,
  })
  const activeRoute =
    [...appRoutes]
      .sort((a, b) => b.path.length - a.path.length)
      .find((route) => location.pathname.startsWith(route.path)) ?? appRoutes[0]
  const owner = ownerQuery.data
  const ownerName =
    owner?.name || owner?.username || owner?.handle || t('shell.owner.fallback')
  const shouldShowDebugMenu =
    window.injectData.PAGE_PROXY || appInfoQuery.data?.version === 'dev'
  const isInApiDebugMode = Boolean(
    localStorage.getItem('__api') ||
    localStorage.getItem('__gateway') ||
    sessionStorage.getItem('__api') ||
    sessionStorage.getItem('__gateway') ||
    window.injectData.PAGE_PROXY,
  )
  const visibleSidebarNavigation = useMemo(
    () =>
      shouldShowDebugMenu
        ? sidebarNavigation
        : sidebarNavigation
            .map((section) => ({
              ...section,
              items: section.items.flatMap((node) => {
                const visibleNode = filterSidebarNode(node)

                return visibleNode ? [visibleNode] : []
              }),
            }))
            .filter((section) => section.items.length > 0),
    [shouldShowDebugMenu],
  )
  const isRouteActive = (route: SidebarNavRoute) =>
    doesRouteMatch(route, activeRoute.path, location.pathname)
  const isNodeActive = (node: SidebarNavNode): boolean =>
    isRouteActive(node.route) ||
    (node.children ?? []).some((child) => isNodeActive(child))
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(),
  )

  useEffect(() => {
    const activeNodePaths = visibleSidebarNavigation
      .flatMap((section) => section.items)
      .flatMap((node) =>
        collectActiveParentPaths(node, activeRoute.path, location.pathname),
      )

    if (!activeNodePaths.length) {
      return
    }

    setExpandedPaths((previous) => {
      const next = new Set(previous)
      let changed = false

      activeNodePaths.forEach((path) => {
        if (!next.has(path)) {
          next.add(path)
          changed = true
        }
      })

      return changed ? next : previous
    })
  }, [activeRoute.path, location.pathname, visibleSidebarNavigation])

  const toggleExpandedPath = (path: string) => {
    setExpandedPaths((previous) => {
      const next = new Set(previous)

      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }

      return next
    })
  }
  const handleLogout = async () => {
    await authClient.signOut()
    sessionStorage.removeItem(SESSION_WITH_LOGIN)
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <main className="grid h-screen min-h-0 grid-cols-[240px_minmax(0,1fr)] overflow-hidden bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <aside className="flex h-screen min-h-0 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div
          className={cn(
            'flex shrink-0 items-center justify-between px-3',
            APP_SHELL_HEADER_HEIGHT_CLASS,
          )}
        >
          <NavLink
            className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
            title={ownerName}
            to="/setting?group=user"
          >
            {owner?.avatar ? (
              <img
                alt=""
                className="size-5 shrink-0 rounded-lg object-cover"
                decoding="async"
                src={owner.avatar}
              />
            ) : (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-lg bg-neutral-200 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                {ownerName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="truncate">{ownerName}</span>
          </NavLink>

          <a
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
            href={WEB_URL}
            rel="noreferrer"
            target="_blank"
            title={t('common.openMainSite')}
          >
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        </div>

        <nav
          className="min-h-0 flex-1 overflow-y-auto"
          aria-label={t('common.primaryNavigation')}
        >
          <div className="flex flex-col gap-3 py-3">
            {visibleSidebarNavigation.map((section, sectionIndex) => (
              <div
                className="grid gap-1 px-2"
                key={section.titleKey ?? `section-${sectionIndex}`}
              >
                {section.titleKey ? (
                  <div className="px-3 pb-1 text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
                    {t(section.titleKey)}
                  </div>
                ) : null}
                {section.items.map((node) => (
                  <SidebarNavItem
                    active={isNodeActive(node)}
                    depth={0}
                    isExpanded={(path) => expandedPaths.has(path)}
                    isRouteActive={isRouteActive}
                    isNodeActive={isNodeActive}
                    key={node.route.path}
                    node={node}
                    onExpandedChange={toggleExpandedPath}
                    t={t}
                  />
                ))}
              </div>
            ))}
          </div>
        </nav>

        <div className="flex items-center gap-2 border-t border-neutral-200 p-2 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <div
            aria-label={t('shell.theme.label')}
            className="grid w-[5.75rem] shrink-0 grid-cols-3 gap-0.5 rounded bg-neutral-100 p-0.5 dark:bg-neutral-900"
            role="group"
          >
            {themeModeOptions.map((option) => {
              const Icon = option.icon
              const active = option.value === themeMode

              return (
                <button
                  aria-label={t(themeModeLabelKeys[option.value])}
                  className={cn(
                    'inline-flex size-7 items-center justify-center rounded text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50',
                    active
                      ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-neutral-50'
                      : null,
                  )}
                  key={option.value}
                  onClick={() => setThemeMode(option.value)}
                  title={t(themeModeLabelKeys[option.value])}
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-3.5" />
                </button>
              )
            })}
          </div>
          <div className="min-w-0 flex-1">
            <SelectField
              aria-label={t('shell.locale.label')}
              onValueChange={setLocale}
              options={SUPPORTED_LOCALES.map((value) => ({
                label: t(localeLabelKeys[value]),
                value,
              }))}
              popupClassName="text-xs"
              triggerClassName="h-8 w-full text-xs"
              value={locale}
            />
          </div>
          <button
            aria-label={t('shell.logout')}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
            onClick={() => void handleLogout()}
            title={t('shell.logout')}
            type="button"
          >
            <LogOut aria-hidden="true" className="size-3.5" />
          </button>
        </div>
      </aside>

      <section className="flex h-screen min-h-0 min-w-0 flex-col">
        {isInApiDebugMode ? (
          <div
            className={cn(
              'flex h-7 shrink-0 items-center gap-2 overflow-hidden whitespace-nowrap border-b border-amber-200 bg-amber-50 px-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100',
              window.injectData.PAGE_PROXY
                ? 'bg-red-50 dark:bg-red-950/30'
                : null,
            )}
          >
            <span>API endpoint mode:</span>
            <NavLink
              className="font-medium underline-offset-2 hover:underline"
              to="/setup-api"
            >
              setup-api
            </NavLink>
            <span className="min-w-0 truncate">
              | Endpoint: {API_URL || '-'} | Gateway: {GATEWAY_URL || '-'}
              {window.injectData.PAGE_PROXY ? ' | Local dev mode' : ''}
            </span>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">{props.children}</div>
      </section>
    </main>
  )
}

function SidebarNavItem(props: {
  active: boolean
  depth: number
  isExpanded: (path: string) => boolean
  isRouteActive: (route: SidebarNavRoute) => boolean
  isNodeActive: (node: SidebarNavNode) => boolean
  node: SidebarNavNode
  onExpandedChange: (path: string) => void
  t: (key: TranslationKey) => string
}) {
  const Icon = props.node.route.icon
  const hasChildren = !!props.node.children?.length
  const expanded = props.isExpanded(props.node.route.path)
  const parentClassName = cn(
    'grid w-full grid-cols-[1rem_minmax(0,1fr)_1rem] items-center gap-2 rounded text-left transition-colors',
    props.depth === 0 ? 'h-9 px-3 text-sm' : 'h-8 px-2 text-[13px]',
    hasChildren
      ? props.active
        ? 'bg-neutral-100 font-medium text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50'
        : inactiveLinkClassName
      : props.isRouteActive(props.node.route)
        ? activeLinkClassName
        : props.active
          ? 'bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50'
          : inactiveLinkClassName,
  )

  return (
    <div>
      {hasChildren ? (
        <button
          aria-expanded={expanded}
          className={parentClassName}
          onClick={() => props.onExpandedChange(props.node.route.path)}
          title={props.t(props.node.route.descriptionKey)}
          type="button"
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            {props.t(props.node.route.titleKey)}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-3.5 shrink-0 text-neutral-400 transition-transform',
              expanded ? 'rotate-180' : null,
            )}
          />
        </button>
      ) : (
        <NavLink
          className={parentClassName}
          title={props.t(props.node.route.descriptionKey)}
          to={props.node.route.path}
        >
          <Icon
            aria-hidden="true"
            className={cn(
              'shrink-0',
              props.depth === 0 ? 'size-4' : 'size-3.5',
            )}
          />
          <span className="min-w-0 flex-1 truncate">
            {props.t(props.node.route.titleKey)}
          </span>
          <span aria-hidden="true" className="size-3.5" />
        </NavLink>
      )}

      {hasChildren ? (
        <div
          className={cn(
            'grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out',
            expanded
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0">
            <div className="ml-4 mt-1 grid gap-0.5 border-l border-neutral-200 pl-2 dark:border-neutral-800">
              {props.node.children?.map((child) => (
                <SidebarNavItem
                  active={props.isNodeActive(child)}
                  depth={props.depth + 1}
                  isExpanded={props.isExpanded}
                  isRouteActive={props.isRouteActive}
                  isNodeActive={props.isNodeActive}
                  key={child.route.path}
                  node={child}
                  onExpandedChange={props.onExpandedChange}
                  t={props.t}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function collectActiveParentPaths(
  node: SidebarNavNode,
  activePath: string,
  currentPath: string,
): string[] {
  if (!node.children?.length) {
    return []
  }

  const activeChildPaths = node.children.flatMap((child) =>
    collectActiveParentPaths(child, activePath, currentPath),
  )
  const hasActiveDescendant =
    doesRouteMatch(node.route, activePath, currentPath) ||
    activeChildPaths.length > 0 ||
    node.children.some((child) =>
      doesRouteMatch(child.route, activePath, currentPath),
    )

  return hasActiveDescendant
    ? [node.route.path, ...activeChildPaths]
    : activeChildPaths
}

function doesRouteMatch(
  route: SidebarNavRoute,
  activePath: string,
  currentPath: string,
) {
  return (
    route.path === activePath ||
    route.path === currentPath ||
    (route.matchPaths ?? []).some(
      (path) => path === activePath || path === currentPath,
    )
  )
}

function filterSidebarNode(node: SidebarNavNode): SidebarNavNode | null {
  if (node.route.path === '/debug') {
    return null
  }

  if (!node.children?.length) {
    return node
  }

  const children = node.children.flatMap((child) => {
    const visibleChild = filterSidebarNode(child)

    return visibleChild ? [visibleChild] : []
  })

  return {
    ...node,
    children,
  }
}
