import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import { getDependencyGraph, getNpmPackageLatest } from '~/api/dependencies'
import { Button } from '~/ui/button'
import { cn } from '~/ui/cn'

import { InlineLoading, Modal } from './SnippetPrimitives'

export function UpdateDependenciesModal(props: {
  onInstall: (packageName: string, onFinish?: () => void) => void
  onClose: () => void
  open: boolean
}) {
  const queryClient = useQueryClient()
  const graphQuery = useQuery({
    enabled: props.open,
    queryFn: getDependencyGraph,
    queryKey: ['dependencies', 'graph'],
  })
  const dependencies = Object.entries(graphQuery.data?.dependencies ?? {})
  const refreshDependencies = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dependencies'] }),
      graphQuery.refetch(),
    ])
  }

  return (
    <Modal onClose={props.onClose} open={props.open} title="依赖更新">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            disabled={graphQuery.isFetching}
            onClick={() => void graphQuery.refetch()}
            type="button"
            variant="subtle"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('size-4', graphQuery.isFetching && 'animate-spin')}
            />
            刷新
          </Button>
        </div>
        <div className="overflow-hidden rounded border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-2 font-medium">包名</th>
                <th className="px-3 py-2 font-medium">版本</th>
                <th className="px-3 py-2 font-medium">最新</th>
                <th className="px-3 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {graphQuery.isLoading ? (
                <tr>
                  <td className="px-3 py-8 text-center" colSpan={4}>
                    <InlineLoading label="正在读取依赖图" />
                  </td>
                </tr>
              ) : dependencies.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-8 text-center text-neutral-500"
                    colSpan={4}
                  >
                    暂无依赖。
                  </td>
                </tr>
              ) : (
                dependencies.map(([name, version]) => (
                  <DependencyRow
                    currentVersion={version}
                    key={name}
                    name={name}
                    onUpdate={(packageName) =>
                      props.onInstall(packageName, () => {
                        void refreshDependencies()
                      })
                    }
                    open={props.open}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}

function DependencyRow(props: {
  currentVersion: string
  name: string
  onUpdate: (packageName: string) => void
  open: boolean
}) {
  const latestQuery = useQuery({
    enabled: props.open,
    queryFn: () => getNpmPackageLatest(props.name),
    queryKey: ['npm-latest', props.name],
    staleTime: 5 * 60 * 1000,
  })
  const latestVersion = latestQuery.data?.version

  return (
    <tr>
      <td className="max-w-72 px-3 py-2">
        <a
          className="break-all text-neutral-900 hover:underline dark:text-neutral-100"
          href={`https://npmjs.com/package/${props.name}`}
          rel="noreferrer"
          target="_blank"
        >
          {props.name}
        </a>
      </td>
      <td className="px-3 py-2 font-mono text-xs text-neutral-500">
        {props.currentVersion}
      </td>
      <td className="px-3 py-2 font-mono text-xs text-neutral-500">
        {latestQuery.isLoading ? '...' : (latestVersion ?? '获取失败')}
      </td>
      <td className="px-3 py-2 text-right">
        <Button
          disabled={!latestVersion}
          onClick={() => {
            if (latestVersion) props.onUpdate(`${props.name}@${latestVersion}`)
          }}
          type="button"
          variant="subtle"
        >
          更新
        </Button>
      </td>
    </tr>
  )
}
