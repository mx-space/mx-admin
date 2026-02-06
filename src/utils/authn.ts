import { toast } from 'vue-sonner'

import { authClient } from '~/utils/authjs/auth'

class AuthnUtilsStatic {
  async createPassKey(name: string) {
    try {
      const result = await authClient.passkey.addPasskey({ name })
      if (result.error) {
        toast.error(result.error.message || '注册 Passkey 失败')
        return
      }
      toast.success('Passkey 注册成功')
    } catch (error: any) {
      if (error.name === 'InvalidStateError') {
        toast.error('该 Passkey 已经注册过了')
      } else {
        toast.error(error.message || '注册 Passkey 失败')
      }
    }
  }

  async validate(_test?: boolean) {
    try {
      const result = await authClient.signIn.passkey()
      if (result.error) {
        toast.error(result.error.message || 'Passkey 验证失败')
        return null
      }
      toast.success('Passkey 验证成功')
      return { verified: true }
    } catch (error: any) {
      toast.error(error.message || 'Passkey 验证失败')
      return null
    }
  }
}

export const AuthnUtils = new AuthnUtilsStatic()
