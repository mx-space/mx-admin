import { useMutation } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Button } from '~/ui/primitives/button'
import { Panel } from '~/ui/primitives/panel'
import { TextInput } from '~/ui/primitives/text-field'
import { authClient } from '~/utils/authjs/auth'

import { getErrorMessage } from '../../utils/settings'
import { Modal } from '../SettingsPrimitives'

export function PasswordSection() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!currentPassword || !newPassword) throw new Error('请输入密码')
      if (newPassword !== confirmPassword) throw new Error('两次密码输入不一致')
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })
      if (result.error) throw new Error(result.error.message || '密码修改失败')
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '密码修改失败')),
    onSuccess: async () => {
      toast.success('密码修改成功，请重新登录')
      setOpen(false)
      await authClient.signOut()
      navigate('/login')
    },
  })

  return (
    <>
      <Panel description="修改后需要重新登录。" title="修改密码">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-neutral-500">
            定期更改密码可以提高账户安全性。
          </p>
          <Button onClick={() => setOpen(true)} type="button" variant="subtle">
            <Lock aria-hidden="true" className="size-4" />
            修改密码
          </Button>
        </div>
      </Panel>
      <Modal onClose={() => setOpen(false)} open={open} title="修改密码">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          <TextInput
            label="当前密码"
            onChange={setCurrentPassword}
            type="password"
            value={currentPassword}
          />
          <TextInput
            label="新密码"
            onChange={setNewPassword}
            type="password"
            value={newPassword}
          />
          <TextInput
            label="确认新密码"
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
              取消
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              确认修改
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
