import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/typescript-types'

import { startAuthentication, startRegistration } from '@simplewebauthn/browser'

import { RESTManager } from './rest'

class AuthnUtilsStatic {
  async createPassKey(name: string) {
    const registrationOptions =
      await RESTManager.api.passkey.register.post<any>()
    let attResp: RegistrationResponseJSON
    try {
      // Pass the options to the authenticator and wait for a response
      attResp = await startRegistration(registrationOptions)
    } catch (error: any) {
      // Some basic error handling
      if (error.name === 'InvalidStateError') {
        message.error(
          'Error: Authenticator was probably already registered by user',
        )
      } else {
        message.error(error.message)
      }
    }

    try {
      Object.assign(attResp, {
        name,
      })
      const verificationResp =
        await RESTManager.api.passkey.register.verify.post<any>({
          data: attResp,
        })
      if (verificationResp.verified) {
        message.success('Successfully registered authenticator')
      } else {
        message.error('Error: Could not verify authenticator')
      }
    } catch {
      message.error('Error: Could not verify authenticator')
    }
  }

  async validate(test?: boolean) {
    const registrationOptions =
      await RESTManager.api.passkey.authentication.post<any>()
    let attResp: AuthenticationResponseJSON
    try {
      // Pass the options to the authenticator and wait for a response
      attResp = await startAuthentication(registrationOptions)
    } catch (error: any) {
      // Some basic error handling

      message.error(error.message)
    }

    if (test) {
      Object.assign(attResp, { test: true })
    }
    try {
      const verificationResp =
        await RESTManager.api.passkey.authentication.verify.post<{
          verified: boolean
          token?: string
        }>({
          data: attResp,
        })
      if (verificationResp.verified) {
        message.success('Successfully authentication by passkey')
      } else {
        message.error('Error: Could not verify authenticator')
      }
      return verificationResp
    } catch (err: any) {
      message.error(err.message)
    }
  }
}

export const AuthnUtils = new AuthnUtilsStatic()
