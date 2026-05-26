import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { AiSurface } from '../types/ai'

import { AppPage, PageHeader } from '~/ui/layout/page-layout'
import { cn } from '~/utils/cn'

import { aiSurfaceTabs } from '../constants'
import { getInitialAiSurface } from '../utils/ai'
import {
  InsightsSurface,
  SummariesSurface,
  TranslationsSurface,
} from './AiResourceSurfaces'
import { AiTasksSurface } from './AiTasksSurface'
import { SlugBackfillSurface } from './SlugBackfillSurface'
import { TranslationEntriesSurface } from './TranslationEntriesSurface'

export function AiRouteViewContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const [surface, setSurface] = useState<AiSurface>(() =>
    getInitialAiSurface(location.pathname),
  )

  useEffect(() => {
    setSurface(getInitialAiSurface(location.pathname))
  }, [location.pathname])

  return (
    <AppPage>
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2" role="tablist">
            {aiSurfaceTabs.map((tab) => {
              const Icon = tab.icon
              const active = surface === tab.value

              return (
                <button
                  aria-selected={active}
                  className={cn(
                    'inline-flex h-9 items-center gap-2 rounded border px-3 text-sm font-medium transition-colors',
                    active
                      ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900',
                  )}
                  key={tab.value}
                  onClick={() => navigate(tab.path)}
                  role="tab"
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        }
        description="管理任务、摘要、翻译、精读、词表与 slug 回填。"
        title="AI 管理"
      />

      <div className="min-h-0 flex-1">
        {surface === 'tasks' ? <AiTasksSurface /> : null}
        {surface === 'summaries' ? <SummariesSurface /> : null}
        {surface === 'translations' ? <TranslationsSurface /> : null}
        {surface === 'insights' ? <InsightsSurface /> : null}
        {surface === 'entries' ? <TranslationEntriesSurface /> : null}
        {surface === 'slug' ? <SlugBackfillSurface /> : null}
      </div>
    </AppPage>
  )
}
