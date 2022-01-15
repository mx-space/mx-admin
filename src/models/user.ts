export interface UserModel {
  ok: number
  id: string
  introduce: string
  mail: string
  url: string
  name: string
  socialIds?: Record<string, string | number>
  username: string
  created: Date
  modified: Date
  v: number
  lastLoginTime: string
  lastLoginIp?: string
  avatar: string
  postID: string
}
