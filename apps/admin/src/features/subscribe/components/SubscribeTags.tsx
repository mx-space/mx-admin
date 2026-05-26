import { subscribeBits } from '../constants'

export function SubscribeTags(props: { subscribe: number }) {
  const tags = subscribeBits.filter(({ bit }) => bit & props.subscribe)

  if (tags.length === 0) {
    return <span className="text-xs text-neutral-400">未选择</span>
  }

  return (
    <div className="flex items-center gap-1.5">
      {tags.map((tag) => (
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${tag.className}`}
          key={tag.bit}
        >
          {tag.label}
        </span>
      ))}
    </div>
  )
}
