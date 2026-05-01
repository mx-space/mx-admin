export interface UserModel {
  ok?: number
  id: string
  introduce?: string
  mail?: string
  url?: string
  name: string
  socialIds?: Record<string, string | number>
  username: string
  role?: 'reader' | 'owner'
  email?: string
  image?: string
  handle?: string
  displayUsername?: string
  created?: string | Date
  modified?: string | Date
  v?: number
  lastLoginTime?: string
  lastLoginIp?: string
  avatar?: string
  postID?: string
}
