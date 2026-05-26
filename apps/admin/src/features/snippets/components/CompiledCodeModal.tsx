import { useQuery } from '@tanstack/react-query'
import type { SnippetModel } from '~/models/snippet'

import { getCompiledCode } from '~/api/serverless'
import { Scroll } from '~/ui/scroll'

import { getErrorMessage } from '../utils/snippets'
import { InlineLoading, Modal } from './SnippetPrimitives'

export function CompiledCodeModal(props: {
  onClose: () => void
  open: boolean
  snippet: SnippetModel | null
}) {
  const query = useQuery({
    enabled: props.open && Boolean(props.snippet?.id),
    queryFn: () => getCompiledCode(String(props.snippet?.id)),
    queryKey: ['serverless', 'compiled', props.snippet?.id],
  })

  return (
    <Modal
      onClose={props.onClose}
      open={props.open}
      title={`编译产物${props.snippet?.name ? `：${props.snippet.name}` : ''}`}
    >
      {query.isLoading ? (
        <InlineLoading label="正在读取编译产物" />
      ) : query.isError ? (
        <p className="text-sm text-red-600">
          {getErrorMessage(query.error, '读取编译产物失败')}
        </p>
      ) : (
        <Scroll
          className="rounded border border-neutral-200 bg-neutral-950 dark:border-neutral-800"
          orientation="both"
          viewportClassName="max-h-[70vh]"
        >
          <pre className="p-4 font-mono text-xs leading-5 text-neutral-100">
            {query.data || '暂无编译产物'}
          </pre>
        </Scroll>
      )}
    </Modal>
  )
}
