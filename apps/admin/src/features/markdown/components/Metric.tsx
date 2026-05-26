export function Metric(props: { label: string; value: number }) {
  return (
    <div className="rounded border border-neutral-200 px-3 py-2 dark:border-neutral-800">
      <div className="text-xs text-neutral-500">{props.label}</div>
      <div className="mt-1 text-sm font-medium tabular-nums text-neutral-950 dark:text-neutral-50">
        {props.value}
      </div>
    </div>
  )
}
