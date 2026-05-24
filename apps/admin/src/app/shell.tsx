import { NavLink, useLocation } from 'react-router'
import type { PropsWithChildren } from 'react'

import { appRoutes } from './routes'

const activeLinkClassName =
  'bg-neutral-950 text-white shadow-sm dark:bg-neutral-50 dark:text-neutral-950'
const inactiveLinkClassName =
  'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-50'

export function AdminShell(props: PropsWithChildren) {
  const location = useLocation()
  const activeRoute =
    [...appRoutes]
      .sort((a, b) => b.path.length - a.path.length)
      .find((route) => location.pathname.startsWith(route.path)) ?? appRoutes[0]

  return (
    <main className="grid min-h-screen grid-cols-[240px_minmax(0,1fr)] bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <aside className="flex min-h-screen flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-primary)]">
            Mx Space
          </div>
          <div className="mt-1 text-lg font-semibold">Admin</div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Primary">
          {appRoutes.map((route) => {
            const Icon = route.icon

            return (
              <NavLink
                className={() =>
                  [
                    'flex h-9 items-center gap-2 rounded px-3 text-sm transition-colors',
                    activeRoute.path === route.path
                      ? activeLinkClassName
                      : inactiveLinkClassName,
                  ].join(' ')
                }
                key={route.path}
                to={route.path}
              >
                <Icon aria-hidden="true" className="size-4" />
                <span>{route.title}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-neutral-200 p-4 text-xs leading-5 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          React admin runtime.
        </div>
      </aside>

      <section className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6 dark:border-neutral-800 dark:bg-neutral-950">
          <div>
            <h1 className="text-base font-semibold">{activeRoute.title}</h1>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {activeRoute.description}
            </p>
          </div>
          <span className="rounded border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            React
          </span>
        </header>

        <div className="p-6">{props.children}</div>
      </section>
    </main>
  )
}
