import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock3, PackageCheck, Route } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { MetricCard } from '../ui/metric-card'
import { Panel } from '../ui/panel'

const statusItems = [
  {
    icon: CheckCircle2,
    label: 'Root runtime',
    value: 'ReactDOM',
  },
  {
    icon: Route,
    label: 'Router',
    value: 'React Router',
  },
  {
    icon: PackageCheck,
    label: 'UI primitive',
    value: 'Base UI',
  },
  {
    icon: Clock3,
    label: 'Source tree',
    value: 'React app',
  },
] as const

export function DashboardPage() {
  const environmentQuery = useQuery({
    queryFn: async () => ({
      api: window.injectData.BASE_API || 'not configured',
      gateway: window.injectData.GATEWAY || 'not configured',
      version: window.version || 'N/A',
      web: window.injectData.WEB_URL || 'not configured',
    }),
    queryKey: ['runtime-environment'],
  })

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-3 md:grid-cols-4">
        {statusItems.map((item) => (
          <MetricCard
            icon={item.icon}
            key={item.label}
            label={item.label}
            value={item.value}
          />
        ))}
      </section>

      <Panel
        description="Loaded through TanStack React Query from the browser runtime."
        title="Runtime environment"
      >
        <dl className="grid gap-px bg-neutral-200 text-sm md:grid-cols-2 dark:bg-neutral-800">
          {Object.entries(environmentQuery.data ?? {}).map(([key, value]) => (
            <div className="bg-white p-4 dark:bg-neutral-950" key={key}>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                {key}
              </dt>
              <dd className="mt-1 font-mono text-xs text-neutral-800 dark:text-neutral-200">
                {String(value)}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Button
        className="w-fit"
        onClick={() => toast.success('React Sonner is mounted')}
        type="button"
      >
        Verify toast runtime
      </Button>
    </div>
  )
}
