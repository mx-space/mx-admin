import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ListPlus, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { CreateMetaPresetDto } from '~/models/meta-preset'

import {
  deleteMetaPreset,
  getMetaPresets,
  updateMetaPreset,
  updateMetaPresetOrder,
} from '~/api/meta-presets'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { Panel } from '~/ui/primitives/panel'
import { cn } from '~/utils/cn'

import { metaPresetsQueryKey } from '../../constants'
import { getErrorMessage } from '../../utils/settings'
import { EmptyState } from '../SettingsPrimitives'
import { MetaPresetModal } from './MetaPresetModal'
import { MetaPresetRow } from './MetaPresetRow'

export function MetaPresetSettings() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [modalState, setModalState] = useState<{
    id?: string
    mode: 'create' | 'edit'
  } | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const presetsQuery = useQuery({
    queryFn: () => getMetaPresets(),
    queryKey: metaPresetsQueryKey,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      data: Partial<CreateMetaPresetDto>
      id: string
    }) => updateMetaPreset(id, data),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('settings.meta.error.update'))),
    onSuccess: async () => {
      toast.success(t('settings.meta.success.update'))
      await queryClient.invalidateQueries({ queryKey: metaPresetsQueryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMetaPreset,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('settings.meta.error.delete'))),
    onSuccess: async () => {
      toast.success(t('settings.meta.success.delete'))
      await queryClient.invalidateQueries({ queryKey: metaPresetsQueryKey })
    },
  })

  const orderMutation = useMutation({
    mutationFn: updateMetaPresetOrder,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('settings.meta.error.orderSave'))),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: metaPresetsQueryKey })
    },
  })

  const presets = presetsQuery.data ?? []

  const dropPreset = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return
    const items = [...presets]
    const [item] = items.splice(draggedIndex, 1)
    items.splice(dropIndex, 0, item)
    setDraggedIndex(null)
    orderMutation.mutate(items.map((preset) => preset.id))
  }

  return (
    <Panel
      description={t('settings.meta.description')}
      title={
        <span className="inline-flex items-center gap-2">
          <ListPlus aria-hidden="true" className="size-4" />
          {t('settings.meta.title')}
        </span>
      }
    >
      <div className="flex justify-end border-b border-neutral-100 p-3 dark:border-neutral-900">
        <Button onClick={() => setModalState({ mode: 'create' })} type="button">
          <Plus aria-hidden="true" className="size-4" />
          {t('settings.meta.action.addPreset')}
        </Button>
      </div>
      {presetsQuery.isLoading ? (
        <div className="p-4 text-sm text-neutral-500">
          {t('settings.common.loading')}
        </div>
      ) : presets.length === 0 ? (
        <EmptyState
          icon={<ListPlus className="size-7" />}
          label={t('settings.meta.empty')}
        />
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
          {presets.map((preset, index) => (
            <div
              className={cn(
                'transition-opacity',
                draggedIndex === index && 'opacity-50',
              )}
              draggable={!preset.isBuiltin}
              key={preset.id}
              onDragEnd={() => setDraggedIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDraggedIndex(index)}
              onDrop={(event) => {
                event.preventDefault()
                dropPreset(index)
              }}
            >
              <MetaPresetRow
                onDelete={(id) => {
                  if (
                    window.confirm(
                      t('settings.meta.confirm.delete', {
                        label: preset.label,
                      }),
                    )
                  ) {
                    deleteMutation.mutate(id)
                  }
                }}
                onEdit={(id) => setModalState({ id, mode: 'edit' })}
                onToggle={(item) =>
                  updateMutation.mutate({
                    data: { enabled: !item.enabled },
                    id: item.id,
                  })
                }
                preset={preset}
              />
            </div>
          ))}
        </div>
      )}

      <MetaPresetModal
        id={modalState?.id}
        onClose={() => setModalState(null)}
        open={Boolean(modalState)}
      />
    </Panel>
  )
}
