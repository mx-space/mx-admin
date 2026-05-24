import { Select } from '@base-ui/react/select'
import { ChevronDown, Code2, RadioTower, SendHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { ReactNode } from 'react'

import { postJson } from '../api/http'
import { useLocalStorageState } from '../hooks/use-local-storage-state'
import { EventTypes } from '../socket/types'
import { Button } from '../ui/button'
import { Panel } from '../ui/panel'
import { TextArea } from '../ui/text-field'

type DebugTarget = 'admin' | 'all' | 'web'
type PayloadMap = Partial<Record<EventTypes, string>>

const targetOptions: DebugTarget[] = ['web', 'all', 'admin']
const defaultPayload = 'export default {}'

export function EventsDebugPage() {
  const [event, setEvent] = useLocalStorageState<EventTypes>(
    'debug-event-name',
    EventTypes.POST_CREATE,
  )
  const [payloadMap, setPayloadMap] = useLocalStorageState<PayloadMap>(
    'debug-event',
    {},
  )
  const [target, setTarget] = useLocalStorageState<DebugTarget>(
    'debug-event-type',
    'web',
  )
  const [isSending, setIsSending] = useState(false)

  const eventOptions = useMemo(() => Object.values(EventTypes), [])
  const payload = payloadMap[event] ?? defaultPayload

  const updatePayload = (nextPayload: string) => {
    setPayloadMap({
      ...payloadMap,
      [event]: nextPayload,
    })
  }

  const sendEvent = async () => {
    setIsSending(true)

    try {
      const parsedPayload = parseDebugPayload(payload)

      await postJson<void, { payload: unknown; type: string }>(
        '/debug/events',
        {
          payload: parsedPayload,
          type: `${target}:${event}`,
        },
      )
      toast.success('调试事件已发送', {
        description: `${target}:${event}`,
      })
    } catch (error) {
      toast.error('调试事件发送失败', {
        description: readErrorMessage(error),
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Panel
        description="Compose and dispatch synthetic socket events from the React runtime."
        title="Event dispatcher"
      >
        <div className="flex flex-col gap-5 p-4">
          <Field label="Target">
            <Select.Root
              items={targetOptions.map((value) => ({
                label: value,
                value,
              }))}
              onValueChange={(value: unknown) => {
                if (isDebugTarget(value)) setTarget(value)
              }}
              value={target}
            >
              <SelectTrigger />
              <Select.Portal>
                <Select.Positioner alignItemWithTrigger={false} sideOffset={6}>
                  <Select.Popup className="z-50 min-w-40 rounded border border-neutral-200 bg-white p-1 text-sm shadow-lg outline-none dark:border-neutral-800 dark:bg-neutral-950">
                    {targetOptions.map((value) => (
                      <Select.Item
                        className="cursor-pointer rounded px-2 py-1.5 text-neutral-700 outline-none data-[highlighted]:bg-neutral-100 data-[selected]:text-[var(--color-primary)] dark:text-neutral-200 dark:data-[highlighted]:bg-neutral-800"
                        key={value}
                        value={value}
                      >
                        {value}
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Field>

          <Field label="Event">
            <Select.Root
              items={eventOptions.map((value) => ({
                label: value,
                value,
              }))}
              onValueChange={(value: unknown) => {
                if (isEventType(value)) setEvent(value)
              }}
              value={event}
            >
              <SelectTrigger />
              <Select.Portal>
                <Select.Positioner alignItemWithTrigger={false} sideOffset={6}>
                  <Select.Popup className="z-50 max-h-72 min-w-56 overflow-auto rounded border border-neutral-200 bg-white p-1 text-sm shadow-lg outline-none dark:border-neutral-800 dark:bg-neutral-950">
                    {eventOptions.map((value) => (
                      <Select.Item
                        className="cursor-pointer rounded px-2 py-1.5 text-neutral-700 outline-none data-[highlighted]:bg-neutral-100 data-[selected]:text-[var(--color-primary)] dark:text-neutral-200 dark:data-[highlighted]:bg-neutral-800"
                        key={value}
                        value={value}
                      >
                        {value}
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Field>

          <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-xs leading-5 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
            <RadioTower aria-hidden="true" className="mb-2 size-4" />
            <div className="font-medium text-neutral-700 dark:text-neutral-200">
              {target}:{event}
            </div>
            <div className="mt-1">
              Supported placeholders: {'{{objectId}}'}, {'{{now}}'},{' '}
              {'{{randomtext}}'}, {'{{randomnumber}}'}.
            </div>
          </div>

          <Button disabled={isSending} onClick={sendEvent} type="button">
            <SendHorizontal aria-hidden="true" className="size-4" />
            {isSending ? 'Sending' : 'Send event'}
          </Button>
        </div>
      </Panel>

      <Panel
        description="Enter an object expression or an export default object."
        title={
          <span className="inline-flex items-center gap-2">
            <Code2 aria-hidden="true" className="size-4" />
            Payload
          </span>
        }
      >
        <div className="p-4">
          <TextArea
            controlClassName="min-h-[520px] resize-y p-3 font-mono text-sm leading-6"
            onChange={updatePayload}
            spellCheck={false}
            value={payload}
          />
        </div>
      </Panel>
    </div>
  )
}

function Field(props: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {props.label}
      </span>
      {props.children}
    </label>
  )
}

function SelectTrigger() {
  return (
    <Select.Trigger className="flex h-10 w-full items-center justify-between gap-2 rounded border border-neutral-200 bg-white px-3 text-left text-sm text-neutral-900 outline-none transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-shallow)] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900">
      <Select.Value>{(value: unknown) => String(value ?? '')}</Select.Value>
      <ChevronDown
        aria-hidden="true"
        className="size-4 shrink-0 text-neutral-400"
      />
    </Select.Trigger>
  )
}

function parseDebugPayload(source: string) {
  const replacedSource = source.replace(
    /({{(.*?)}})/g,
    (_match, _placeholder, type: string) => generateFakeData(type),
  )

  return new Function(
    `return ${replacedSource.replace(/^export default\s+/, '')}`,
  )()
}

function generateFakeData(type: string) {
  switch (type) {
    case 'objectId':
      return createObjectId()
    case 'now':
      return new Date().toISOString()
    case 'randomtext':
      return btoa(Math.random().toString()).slice(5, 10)
    case 'randomnumber':
      return String(Math.floor(Math.random() * 10000))
    default:
      return `{{${type}}}`
  }
}

function createObjectId() {
  const hex = '0123456789abcdef'
  const timestamp = Math.floor(Date.now() / 1000).toString(16)
  const random = Array.from(
    { length: 16 },
    () => hex[Math.floor(Math.random() * hex.length)],
  ).join('')

  return timestamp + random
}

function isDebugTarget(value: unknown): value is DebugTarget {
  return (
    typeof value === 'string' && targetOptions.includes(value as DebugTarget)
  )
}

function isEventType(value: unknown): value is EventTypes {
  return (
    typeof value === 'string' &&
    (Object.values(EventTypes) as string[]).includes(value)
  )
}

function readErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}
