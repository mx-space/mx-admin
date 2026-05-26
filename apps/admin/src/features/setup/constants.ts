import { PartyPopper, Rocket, Settings, User } from 'lucide-react'
import type { ComponentType } from 'react'

export const inputClassName =
  'h-[42px] w-full rounded-full border-0 bg-white/20 px-4 text-sm text-white backdrop-blur-md transition-all placeholder:text-white/60 focus-visible:bg-white/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50'

export const labelClassName = 'mb-2 block text-sm font-medium text-white/90'

export const primaryButtonClassName =
  'inline-flex h-[42px] items-center justify-center rounded-full bg-white/90 px-6 text-sm font-medium text-neutral-900 transition-all hover:bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50'

export const secondaryButtonClassName =
  'inline-flex h-[42px] items-center justify-center rounded-full bg-white/15 px-6 text-sm text-white/90 backdrop-blur-sm transition-all hover:bg-white/25 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50'

export const setupSteps: Array<{
  icon: ComponentType<{ className?: string }>
  title: string
}> = [
  { icon: Rocket, title: '开始' },
  { icon: Settings, title: '站点' },
  { icon: User, title: '账户' },
  { icon: PartyPopper, title: '完成' },
]

export const setupStepDescriptions = [
  '欢迎进行初始化配置',
  '请配置站点基本信息',
  '请创建管理员账户',
  '初始化即将完成',
]
