import { NButton } from 'naive-ui'
import { defineComponent } from 'vue'
import { toast } from 'vue-sonner'

import { authClient } from '~/utils/authjs/auth'

export default defineComponent({
  setup() {
    return () => (
      <>
        <NButton
          onClick={async () => {
            try {
              const name = `test-${(Math.random() * 100) | 0}`
              const result = await authClient.passkey.addPasskey({ name })
              if (result.error) {
                toast.error(result.error.message || '注册失败')
              } else {
                toast.success('Passkey 注册成功')
              }
            } catch (error: any) {
              if (error.name === 'InvalidStateError') {
                toast.error('该 Passkey 已经注册过了')
              } else {
                toast.error(error.message || '注册失败')
              }
            }
          }}
        >
          Register
        </NButton>

        <NButton
          onClick={async () => {
            try {
              const result = await authClient.signIn.passkey()
              if (result.error) {
                toast.error(result.error.message || '认证失败')
              } else {
                toast.success('Passkey 认证成功')
              }
            } catch (error: any) {
              toast.error(error.message || '认证失败')
            }
          }}
        >
          Authenticator
        </NButton>
      </>
    )
  },
})
