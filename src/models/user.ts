export interface UserModel {
  ok: number
  id: string
  introduce: string
  mail: string
  url: string
  name: string
  socialIDS: SocialIDS
  username: string
  created: Date
  modified: Date
  v: number
  lastLoginTime: string
  lastLoginIp?: string
  avatar: string
  postID: string
}

interface SocialIDS {
  biliID: number
  neteaseID: number
  github: string
}
