import { toast } from 'sonner'
import type { ReactNode } from 'react'

import { Button } from '~/ui/button'
import { AppPage, PageHeader } from '~/ui/page-layout'
import { Panel } from '~/ui/panel'
import { Scroll } from '~/ui/scroll'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function ToastDebugRouteViewContent() {
  return (
    <AppPage>
      <PageHeader
        description="Inspect toast variants and business notification actions."
        title="Toast Debug"
      />
      <Scroll
        className="min-h-0 flex-1"
        innerClassName="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4"
      >
        <Panel title="基础用法">
          <ToastSection title="状态类型">
            <Button onClick={() => toast.success('操作成功')} variant="subtle">
              Success
            </Button>
            <Button onClick={() => toast.error('操作失败')} variant="subtle">
              Error
            </Button>
            <Button onClick={() => toast.warning('请注意')} variant="subtle">
              Warning
            </Button>
            <Button onClick={() => toast.info('提示信息')} variant="subtle">
              Info
            </Button>
          </ToastSection>

          <ToastSection title="带描述文字">
            <Button
              onClick={() => {
                toast.success('保存成功', {
                  description: '您的更改已保存',
                })
              }}
              variant="subtle"
            >
              Success + Description
            </Button>
            <Button
              onClick={() => {
                toast.error('保存失败', {
                  description: '请检查网络连接后重试',
                })
              }}
              variant="subtle"
            >
              Error + Description
            </Button>
          </ToastSection>

          <ToastSection title="Loading 状态">
            <Button
              onClick={() => {
                const id = toast.loading('加载中...')
                setTimeout(() => {
                  toast.dismiss(id)
                  toast.success('加载完成')
                }, 2000)
              }}
              variant="subtle"
            >
              Loading to Success
            </Button>
            <Button
              onClick={() => {
                const id = toast.loading('处理中...')
                setTimeout(() => {
                  toast.dismiss(id)
                  toast.error('处理失败')
                }, 2000)
              }}
              variant="subtle"
            >
              Loading to Error
            </Button>
          </ToastSection>

          <ToastSection title="手动关闭">
            <Button
              onClick={() => {
                const id = toast.success('3 秒后自动关闭', {
                  duration: Infinity,
                })
                setTimeout(() => {
                  toast.dismiss(id)
                  toast.info('已关闭')
                }, 3000)
              }}
              variant="subtle"
            >
              手动 dismiss
            </Button>
          </ToastSection>
        </Panel>

        <Panel title="带 Action 按钮">
          <ToastSection
            description={'WebSocket 推送新评论，点击"查看"跳转'}
            title="新评论通知"
          >
            <Button
              onClick={() => {
                const id = toast.success('新的评论', {
                  action: {
                    label: '查看',
                    onClick: () => {
                      toast.dismiss(id)
                      toast.info('跳转到评论页面...')
                    },
                  },
                  description: '张三: 这篇文章写得太好了，学到了很多！',
                  duration: 10000,
                })
              }}
              variant="subtle"
            >
              模拟新评论
            </Button>
          </ToastSection>

          <ToastSection
            description={'收到友链申请，点击"查看"跳转到友链管理'}
            title="友链申请"
          >
            <Button
              onClick={() => {
                const id = toast.success('新的友链申请', {
                  action: {
                    label: '查看',
                    onClick: () => {
                      toast.dismiss(id)
                      toast.info('跳转到友链管理...')
                    },
                  },
                  description: 'example.com - 一个有趣的技术博客',
                  duration: 10000,
                })
              }}
              variant="subtle"
            >
              模拟友链申请
            </Button>
          </ToastSection>

          <ToastSection description="检测到新版本提醒" title="版本更新">
            <Button
              onClick={() => {
                toast.info('管理后台有新版本可用', {
                  action: {
                    label: '更新',
                    onClick: () => toast.success('开始更新...'),
                  },
                  description: 'v5.1.0 to v5.2.0',
                  duration: 15000,
                })
              }}
              variant="subtle"
            >
              模拟版本更新
            </Button>
          </ToastSection>

          <ToastSection description="删除后提供撤销功能" title="撤销操作">
            <Button
              onClick={() => {
                toast.success('文件已删除', {
                  action: {
                    label: '撤销',
                    onClick: () => toast.success('已恢复文件'),
                  },
                  description: 'image-2024-01-15.png',
                  duration: 8000,
                })
              }}
              variant="subtle"
            >
              删除 + 撤销
            </Button>
          </ToastSection>

          <ToastSection title="错误重试">
            <Button
              onClick={() => {
                toast.error('保存失败', {
                  action: {
                    label: '重试',
                    onClick: () => toast.info('正在重试...'),
                  },
                  description: '服务器返回错误：500 Internal Server Error',
                  duration: 10000,
                })
              }}
              variant="subtle"
            >
              服务器错误 + 重试
            </Button>
          </ToastSection>
        </Panel>

        <Panel title="常见业务场景">
          <ToastSection title="表单提交">
            <Button
              onClick={async () => {
                const id = toast.loading('提交中...')
                await wait(1500)
                toast.dismiss(id)
                toast.success('提交成功')
              }}
            >
              模拟表单提交
            </Button>
          </ToastSection>

          <ToastSection title="批量操作">
            <Button
              onClick={async () => {
                const id = toast.loading('正在删除 5 篇文章...')
                await wait(1500)
                toast.dismiss(id)
                toast.success('批量删除完成', {
                  action: {
                    label: '撤销',
                    onClick: () => toast.success('已撤销删除'),
                  },
                  description: '已删除 5 篇文章',
                  duration: 10000,
                })
              }}
              variant="subtle"
            >
              批量删除文章
            </Button>
          </ToastSection>

          <ToastSection title="数据同步">
            <Button
              onClick={() => {
                toast.warning('数据库有变动', {
                  action: {
                    label: '刷新',
                    onClick: () => toast.info('页面刷新中...'),
                  },
                  description: '检测到数据更新，建议刷新页面',
                  duration: 10000,
                })
              }}
              variant="subtle"
            >
              数据同步提醒
            </Button>
          </ToastSection>
        </Panel>
      </Scroll>
    </AppPage>
  )
}

interface ToastSectionProps {
  children: ReactNode
  description?: string
  title: string
}

function ToastSection(props: ToastSectionProps) {
  return (
    <section className="border-b border-neutral-100 px-4 py-4 last:border-0 dark:border-neutral-900">
      <h3 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {props.title}
      </h3>
      {props.description ? (
        <p className="mb-3 text-xs text-neutral-400">{props.description}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">{props.children}</div>
    </section>
  )
}
