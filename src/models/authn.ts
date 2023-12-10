export interface AuthnModel {
  name: string

  credentialID: string
  credentialPublicKey: string
  counter: number
  credentialDeviceType: 'singleDevice' | 'multiDevice'
  credentialBackedUp: boolean
}
