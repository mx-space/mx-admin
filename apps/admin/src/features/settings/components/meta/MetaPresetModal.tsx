import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type {
  CreateMetaPresetDto,
  MetaFieldType,
  MetaPresetScope,
} from '~/models/meta-preset'
import type { KeyboardEvent } from 'react'

import {
  createMetaPreset,
  getMetaPresets,
  updateMetaPreset,
} from '~/api/meta-presets'
import { Button } from '~/ui/button'
import { SelectField } from '~/ui/select'
import { Switch } from '~/ui/switch'
import { TextInput } from '~/ui/text-field'

import {
  fieldTypeOptions,
  metaPresetsQueryKey,
  scopeOptions,
  typesWithOptions,
} from '../../constants'
import {
  emptyMetaPreset,
  getErrorMessage,
  metaPresetToForm,
  validateMetaPreset,
} from '../../utils/settings'
import { FieldShell, Modal } from '../SettingsPrimitives'
import { ChildrenEditor } from './ChildrenEditor'
import { OptionsEditor } from './OptionsEditor'

export function MetaPresetModal(props: {
  id?: string
  onClose: () => void
  open: boolean
}) {
  const queryClient = useQueryClient()
  const presetsQuery = useQuery({
    enabled: props.open && Boolean(props.id),
    queryFn: async () => {
      const presets = await getMetaPresets()
      return presets.find((preset) => preset.id === props.id) ?? null
    },
    queryKey: [...metaPresetsQueryKey, props.id],
  })
  const [form, setForm] = useState<CreateMetaPresetDto>(emptyMetaPreset())

  useEffect(() => {
    if (!props.open) return
    if (props.id && presetsQuery.data) {
      setForm(metaPresetToForm(presetsQuery.data))
      return
    }
    if (!props.id) setForm(emptyMetaPreset())
  }, [props.id, props.open, presetsQuery.data])

  const mutation = useMutation({
    mutationFn: () =>
      props.id ? updateMetaPreset(props.id, form) : createMetaPreset(form),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, props.id ? '修改失败' : '创建失败')),
    onSuccess: async () => {
      toast.success(props.id ? '修改成功' : '创建成功')
      props.onClose()
      await queryClient.invalidateQueries({ queryKey: metaPresetsQueryKey })
    },
  })

  const setField = <TKey extends keyof CreateMetaPresetDto>(
    key: TKey,
    value: CreateMetaPresetDto[TKey],
  ) => setForm((current) => ({ ...current, [key]: value }))

  const submit = () => {
    const error = validateMetaPreset(form)
    if (error) {
      toast.error(error)
      return
    }
    mutation.mutate()
  }

  return (
    <Modal
      onClose={props.onClose}
      open={props.open}
      title={props.id ? '编辑预设字段' : '新建预设字段'}
    >
      {presetsQuery.isLoading ? (
        <div className="py-12 text-center text-sm text-neutral-500">
          加载中...
        </div>
      ) : (
        <form
          className="space-y-4"
          onKeyDown={(event: KeyboardEvent<HTMLFormElement>) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              submit()
            }
          }}
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="字段 Key"
              onChange={(value) => setField('key', value)}
              required
              value={form.key}
            />
            <TextInput
              label="显示名称"
              onChange={(value) => setField('label', value)}
              required
              value={form.label}
            />
            <FieldShell label="字段类型">
              <SelectField<MetaFieldType>
                aria-label="字段类型"
                onValueChange={(value) => setField('type', value)}
                options={fieldTypeOptions}
                value={form.type}
              />
            </FieldShell>
            <FieldShell label="作用域">
              <SelectField<MetaPresetScope>
                aria-label="作用域"
                onValueChange={(value) => setField('scope', value)}
                options={scopeOptions}
                value={form.scope ?? 'both'}
              />
            </FieldShell>
          </div>
          <TextInput
            label="描述"
            onChange={(value) => setField('description', value)}
            value={form.description ?? ''}
          />
          <TextInput
            label="占位文本"
            onChange={(value) => setField('placeholder', value)}
            value={form.placeholder ?? ''}
          />
          <Switch
            checked={Boolean(form.enabled ?? true)}
            label="启用"
            onCheckedChange={(value) => setField('enabled', value)}
          />

          {typesWithOptions.includes(form.type) ? (
            <OptionsEditor
              onChange={(options) => setField('options', options)}
              options={form.options ?? []}
            />
          ) : null}

          {form.type === 'object' ? (
            <ChildrenEditor
              childrenFields={form.children ?? []}
              onChange={(children) => setField('children', children)}
            />
          ) : null}

          <div className="flex justify-end gap-2">
            <Button onClick={props.onClose} type="button" variant="subtle">
              取消
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Check aria-hidden="true" className="size-4" />
              )}
              保存
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
