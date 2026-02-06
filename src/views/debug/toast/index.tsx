import { NButton, NCard, NDivider, NSpace } from 'naive-ui'
import { defineComponent } from 'vue'
import { toast } from 'vue-sonner'

export default defineComponent({
  setup() {
    return () => (
      <div class="mx-auto max-w-4xl space-y-6 p-6">
        <h1 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Toast 测试
        </h1>

        <NCard title="基础用法" class="!rounded-xl">
          <div class="space-y-4">
            <div>
              <h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                状态类型
              </h4>
              <NSpace>
                <NButton onClick={() => toast.success('操作成功')}>
                  Success
                </NButton>
                <NButton onClick={() => toast.error('操作失败')}>Error</NButton>
                <NButton onClick={() => toast.warning('请注意')}>
                  Warning
                </NButton>
                <NButton onClick={() => toast.info('提示信息')}>Info</NButton>
              </NSpace>
            </div>

            <NDivider />

            <div>
              <h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                带描述文字
              </h4>
              <NSpace>
                <NButton
                  onClick={() => {
                    toast.success('保存成功', {
                      description: '您的更改已保存',
                    })
                  }}
                >
                  Success + Description
                </NButton>
                <NButton
                  onClick={() => {
                    toast.error('保存失败', {
                      description: '请检查网络连接后重试',
                    })
                  }}
                >
                  Error + Description
                </NButton>
              </NSpace>
            </div>

            <NDivider />

            <div>
              <h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Loading 状态
              </h4>
              <NSpace>
                <NButton
                  onClick={() => {
                    const id = toast.loading('加载中...')
                    setTimeout(() => {
                      toast.dismiss(id)
                      toast.success('加载完成')
                    }, 2000)
                  }}
                >
                  Loading → Success
                </NButton>
                <NButton
                  onClick={() => {
                    const id = toast.loading('处理中...')
                    setTimeout(() => {
                      toast.dismiss(id)
                      toast.error('处理失败')
                    }, 2000)
                  }}
                >
                  Loading → Error
                </NButton>
              </NSpace>
            </div>

            <NDivider />

            <div>
              <h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                手动关闭
              </h4>
              <NSpace>
                <NButton
                  onClick={() => {
                    const id = toast.success('3 秒后自动关闭', {
                      duration: Infinity,
                    })
                    setTimeout(() => {
                      toast.dismiss(id)
                      toast.info('已关闭')
                    }, 3000)
                  }}
                >
                  手动 dismiss
                </NButton>
              </NSpace>
            </div>
          </div>
        </NCard>

        <NCard title="带 Action 按钮" class="!rounded-xl">
          <div class="space-y-4">
            <div>
              <h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                新评论通知
              </h4>
              <p class="mb-2 text-xs text-neutral-400">
                WebSocket 推送新评论，点击"查看"跳转
              </p>
              <NSpace>
                <NButton
                  onClick={() => {
                    const id = toast.success('新的评论', {
                      description: '张三: 这篇文章写得太好了，学到了很多！',
                      action: {
                        label: '查看',
                        onClick: () => {
                          toast.dismiss(id)
                          toast.info('跳转到评论页面...')
                        },
                      },
                      duration: 10000,
                    })
                  }}
                >
                  模拟新评论
                </NButton>
              </NSpace>
            </div>

            <NDivider />

            <div>
              <h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                友链申请
              </h4>
              <p class="mb-2 text-xs text-neutral-400">
                收到友链申请，点击"查看"跳转到友链管理
              </p>
              <NSpace>
                <NButton
                  onClick={() => {
                    const id = toast.success('新的友链申请', {
                      description: 'example.com - 一个有趣的技术博客',
                      action: {
                        label: '查看',
                        onClick: () => {
                          toast.dismiss(id)
                          toast.info('跳转到友链管理...')
                        },
                      },
                      duration: 10000,
                    })
                  }}
                >
                  模拟友链申请
                </NButton>
              </NSpace>
            </div>

            <NDivider />

            <div>
              <h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                版本更新
              </h4>
              <p class="mb-2 text-xs text-neutral-400">检测到新版本提醒</p>
              <NSpace>
                <NButton
                  onClick={() => {
                    toast.info('管理后台有新版本可用', {
                      description: 'v5.1.0 → v5.2.0',
                      action: {
                        label: '更新',
                        onClick: () => toast.success('开始更新...'),
                      },
                      duration: 15000,
                    })
                  }}
                >
                  模拟版本更新
                </NButton>
              </NSpace>
            </div>

            <NDivider />

            <div>
              <h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                撤销操作
              </h4>
              <p class="mb-2 text-xs text-neutral-400">删除后提供撤销功能</p>
              <NSpace>
                <NButton
                  onClick={() => {
                    toast.success('文件已删除', {
                      description: 'image-2024-01-15.png',
                      action: {
                        label: '撤销',
                        onClick: () => toast.success('已恢复文件'),
                      },
                      duration: 8000,
                    })
                  }}
                >
                  删除 + 撤销
                </NButton>
              </NSpace>
            </div>

            <NDivider />

            <div>
              <h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                错误重试
              </h4>
              <NSpace>
                <NButton
                  onClick={() => {
                    toast.error('保存失败', {
                      description: '服务器返回错误：500 Internal Server Error',
                      action: {
                        label: '重试',
                        onClick: () => toast.info('正在重试...'),
                      },
                      duration: 10000,
                    })
                  }}
                >
                  服务器错误 + 重试
                </NButton>
              </NSpace>
            </div>
          </div>
        </NCard>

        <NCard title="常见业务场景" class="!rounded-xl">
          <div class="space-y-4">
            <div>
              <h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                表单提交
              </h4>
              <NSpace>
                <NButton
                  type="primary"
                  onClick={async () => {
                    const id = toast.loading('提交中...')
                    await new Promise((r) => setTimeout(r, 1500))
                    toast.dismiss(id)
                    toast.success('提交成功')
                  }}
                >
                  模拟表单提交
                </NButton>
              </NSpace>
            </div>

            <NDivider />

            <div>
              <h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                批量操作
              </h4>
              <NSpace>
                <NButton
                  onClick={async () => {
                    const id = toast.loading('正在删除 5 篇文章...')
                    await new Promise((r) => setTimeout(r, 1500))
                    toast.dismiss(id)
                    toast.success('批量删除完成', {
                      description: '已删除 5 篇文章',
                      action: {
                        label: '撤销',
                        onClick: () => toast.success('已撤销删除'),
                      },
                      duration: 10000,
                    })
                  }}
                >
                  批量删除文章
                </NButton>
              </NSpace>
            </div>

            <NDivider />

            <div>
              <h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                数据同步
              </h4>
              <NSpace>
                <NButton
                  onClick={() => {
                    toast.warning('数据库有变动', {
                      description: '检测到数据更新，建议刷新页面',
                      action: {
                        label: '刷新',
                        onClick: () => toast.info('页面刷新中...'),
                      },
                      duration: 10000,
                    })
                  }}
                >
                  数据同步提醒
                </NButton>
              </NSpace>
            </div>
          </div>
        </NCard>
      </div>
    )
  },
})
