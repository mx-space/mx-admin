import { NButton } from 'naive-ui'
import { defineComponent } from 'vue'
import { toast } from 'vue-sonner'
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser'

import { startAuthentication, startRegistration } from '@simplewebauthn/browser'

import { authApi } from '~/api'

export default defineComponent({
  setup() {
    return () => {
      return (
        <>
          <NButton
            onClick={async () => {
              const registrationOptions = await authApi.startPasskeyRegister()
              let attResp: RegistrationResponseJSON
              try {
                // Pass the options to the authenticator and wait for a response
                attResp = await startRegistration(registrationOptions)
              } catch (error: any) {
                // Some basic error handling
                if (error.name === 'InvalidStateError') {
                  toast.error(
                    'Error: Authenticator was probably already registered by user',
                  )
                } else {
                  toast.error(error.message)
                }
                return
              }

              try {
                Object.assign(attResp, {
                  name: `test-1${(Math.random() * 100) | 0}`,
                })
                const verificationResp =
                  await authApi.verifyPasskeyRegister(attResp)
                if (verificationResp.verified) {
                  toast.success('Successfully registered authenticator')
                } else {
                  toast.error('Error: Could not verify authenticator')
                }
              } catch {
                toast.error('Error: Could not verify authenticator')
              }
            }}
          >
            Register
          </NButton>

          <NButton
            onClick={async () => {
              const registrationOptions = await authApi.startPasskeyAuth()
              let attResp: AuthenticationResponseJSON
              try {
                // Pass the options to the authenticator and wait for a response
                attResp = await startAuthentication(registrationOptions)
              } catch (error: any) {
                // Some basic error handling

                toast.error(error.message)
                return
              }

              try {
                const verificationResp =
                  await authApi.verifyPasskeyAuth(attResp)
                if (verificationResp.token) {
                  toast.success('Successfully registered authenticator')
                } else {
                  toast.error('Error: Could not verify authenticator')
                }
              } catch (error: any) {
                toast.error(error.message)
              }
            }}
          >
            Authenticator
          </NButton>
        </>
      )
    }
  },
})
