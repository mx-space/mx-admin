import { useMutation } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { Panel } from '~/ui/primitives/panel'
import { TextInput } from '~/ui/primitives/text-field'
import { authClient } from '~/utils/authjs/auth'

import { getErrorMessage } from '../../utils/settings'
import { Modal } from '../SettingsPrimitives'

export function PasswordSection() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!currentPassword || !newPassword)
        throw new Error(t('settings.password.error.empty'))
      if (newPassword !== confirmPassword)
        throw new Error(t('settings.password.error.mismatch'))
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })
      if (result.error)
        throw new Error(
          result.error.message || t('settings.password.error.failed'),
        )
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('settings.password.error.failed'))),
    onSuccess: async () => {
      toast.success(t('settings.password.success'))
      setOpen(false)
      await authClient.signOut()
      navigate('/login')
    },
  })

  return (
    <>
      <Panel
        description={t('settings.password.description')}
        title={t('settings.password.title')}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-neutral-500">
            {t('settings.password.helper')}
          </p>
          <Button onClick={() => setOpen(true)} type="button" variant="subtle">
            <Lock aria-hidden="true" className="size-4" />
            {t('settings.password.title')}
          </Button>
        </div>
      </Panel>
      <Modal
        onClose={() => setOpen(false)}
        open={open}
        title={t('settings.password.title')}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          <TextInput
            label={t('settings.password.field.current')}
            onChange={setCurrentPassword}
            type="password"
            value={currentPassword}
          />
          <TextInput
            label={t('settings.password.field.new')}
            onChange={setNewPassword}
            type="password"
            value={newPassword}
          />
          <TextInput
            label={t('settings.password.field.confirm')}
            onChange={setConfirmPassword}
            type="password"
            value={confirmPassword}
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="subtle"
            >
              {t('common.cancel')}
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {t('settings.password.confirm.submit')}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
