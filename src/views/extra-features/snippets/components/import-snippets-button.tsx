import {
  ExternalLink as ExternalLinkIcon,
  Download as ImportIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPopover,
  NTag,
  useDialog,
} from 'naive-ui'
import { basename, extname } from 'path-browserify'
import {
  defineComponent,
  h,
  nextTick,
  onMounted,
  ref,
  unref,
  watchEffect,
} from 'vue'
import { toast } from 'vue-sonner'
import type { SnippetModel } from '~/models/snippet'
import type { PropType } from 'vue'

import { snippetsApi } from '~/api'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { CodeHighlight } from '~/components/code-highlight'
import { CenterSpin } from '~/components/spin'
import { GitHubSnippetRepo } from '~/external/api/github-mx-snippets'
import { SnippetType } from '~/models/snippet'

import { InstallDepsXterm } from './install-dep-xterm'

type SnippetList = {
  name: string
  url: string
}[]

const useFetchAvailableSnippets = () => {
  const list = ref([] as SnippetList)
  const loading = ref(true)
  const fetch = async () => {
    const data = await GitHubSnippetRepo.fetchFileTree()

    if (Array.isArray(data)) {
      list.value = data
        .filter(
          ({ type, name }) =>
            type === 'dir' &&
            (!import.meta.env.DEV ? !name.startsWith('test:') : true),
        )
        .map(({ name, html_url }) => ({ name, url: html_url || '' }))
    }

    loading.value = false
  }

  return [list, fetch, loading] as const
}

export const ImportSnippetButton = defineComponent({
  props: {
    onFinish: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const show = ref(false)
    const onSubmit = (e: Event): void => {
      e.stopPropagation()
      e.preventDefault()
      handleProcess()
    }

    const [list, fetchAvailableSnippets, loading] = useFetchAvailableSnippets()

    watchEffect(() => {
      if (show.value) {
        fetchAvailableSnippets()
      }
    })

    const name = ref('')

    const modal = useDialog()

    const handleProcess = async () => {
      const instance = modal.create({
        title: '获取和解析',
        content: () =>
          h(ProcessView, {
            name: name.value,
            onFinish: () => {
              instance.destroy()
              props.onFinish()
            },
            // FIXME 传一个 rootOnFinish 给 PTY 完事之后用
            onRootFinish: () => {
              props.onFinish()
            },
          }),
        closable: true,
      })
    }

    return () => (
      <>
        <HeaderActionButton
          variant="info"
          onClick={() => {
            show.value = true
          }}
          icon={<ImportIcon />}
          name="下载扩展包"
        />
        <NModal
          show={show.value}
          onUpdateShow={(state) => {
            show.value = state
          }}
        >
          <NCard class="modal-card sm" title="导入 Snippets">
            <NForm onSubmit={onSubmit}>
              <NFormItem label="包名">
                <NInput
                  placeholder="支持导入 GitHub repo:mx-space/snippets 下的集合包，示例输入: kami"
                  value={name.value}
                  onUpdateValue={(str) => {
                    name.value = str
                  }}
                />
              </NFormItem>

              <NFormItem label="可获取的">
                {loading.value ? (
                  <CenterSpin />
                ) : (
                  <div class="flex flex-wrap space-x-2">
                    {list.value.map(({ name: name_, url }) => (
                      <div class="ml-4 flex items-center" key="name">
                        <NButton
                          quaternary
                          onClick={() => {
                            name.value = name_
                            nextTick(() => {
                              handleProcess()
                            })
                          }}
                        >
                          {name_}
                        </NButton>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <ExternalLinkIcon class="ml-2 !h-4 !w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </NFormItem>
              <div class="flex justify-end">
                <NButton round type="primary" onClick={handleProcess}>
                  处理
                </NButton>
              </div>
            </NForm>
          </NCard>
        </NModal>
      </>
    )
  },
})

type FunctionList = {
  name: string
  reference: string
  raw: string

  htmlUrl?: string | null
}[]

const ProcessView = defineComponent({
  props: {
    name: {
      type: String,
      required: true,
    },

    onFinish: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onRootFinish: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const loading = ref(true)
    const functions = ref([] as FunctionList)
    const dependencies = ref([] as string[])

    onMounted(async () => {
      const data = await GitHubSnippetRepo.fetchFileTree(props.name)

      if (Array.isArray(data)) {
        const tasks = data.map(async (fileInfo) => {
          if (fileInfo.type === 'dir') {
            switch (fileInfo.name) {
              case 'functions': {
                const files = await GitHubSnippetRepo.fetchFileTree(
                  `${props.name}/functions`,
                )
                if (Array.isArray(files)) {
                  await Promise.all(
                    files.map(async (file) => {
                      if (
                        file.type === 'file' &&
                        /\.(js|ts)$/.test(file.name)
                      ) {
                        const download_url = file.download_url
                        if (!download_url) {
                          toast.error(`获取下载地址失败，${file.name}`)
                          return
                        }
                        const text = await fetch(download_url).then((res) =>
                          res.text(),
                        )

                        functions.value.push({
                          name: file.name,
                          reference: props.name,
                          raw: text,

                          htmlUrl: file.html_url,
                        })
                      }
                    }),
                  )
                }

                break
              }
              case 'schema': {
                // const files = await GitHubSnippetRepo.fetchFileTree(
                //   `${props.name}/schema`,
                // )
                // if (Array.isArray(files)) {
                //   await Promise.all(files.map(async (file) => {}))
                // }
                // TODO

                break
              }
            }
          } else if (fileInfo.name === 'package.json') {
            const fileDownloadUrl = fileInfo.download_url

            if (!fileDownloadUrl) {
              toast.error('无法获取 package.json 文件的下载地址')
              return
            }

            const pkgContent = await fetch(fileDownloadUrl).then((res) =>
              res.text(),
            )
            const parsedPKG = JSON.parse(pkgContent)
            dependencies.value = Object.entries(
              parsedPKG.dependencies || {},
            ).map(([key, version]) => {
              return `${key}@${version}`
            })
          }
        })

        await Promise.all(tasks)
        loading.value = false
      }
    })

    const handleSubmit = async () => {
      const payload = {
        snippets: functions.value.map((item) => {
          return {
            name: basename(item.name, extname(item.name)),
            reference: item.reference,
            raw: item.raw,
            private: false,
            type: SnippetType.Function,
          }
        }) as SnippetModel[],
        packages: unref(dependencies),
      }

      const message$ = toast.loading('正在导入...', {
        duration: 10e5,
      })
      await snippetsApi.import(payload)
      toast.dismiss(message$)
      if (payload.packages.length > 0) {
        // @ts-ignore
        $installDepsComponent.value?.install(payload.packages, () => {
          props.onRootFinish()
        })
      } else {
        toast.success('导入成功')
        props.onFinish()
      }
    }

    const $installDepsComponent = ref<InstanceType<typeof InstallDepsXterm>>()

    return () => {
      const { name } = props
      return (
        <div>
          <p>获取： {name}</p>
          {loading.value ? (
            <div class="relative h-24">
              <CenterSpin description="需要从 GitHub 获取，建议连接代理后操作。" />
            </div>
          ) : (
            <NForm>
              <NFormItem label="将导入的函数：">
                <div class={'space-x-2'}>
                  {functions.value.map(
                    ({ name, reference, raw, htmlUrl }, index) => (
                      <NPopover
                        key={`${reference}/${name}`}
                        trigger="hover"
                        placement="right"
                      >
                        {{
                          trigger() {
                            return (
                              <NButton
                                quaternary
                                onClick={() => {
                                  htmlUrl && window.open(htmlUrl)
                                }}
                                class="cursor-pointer"
                              >
                                <NTag
                                  closable
                                  onClose={(e) => {
                                    e.stopPropagation()
                                    functions.value.splice(index, 1)
                                  }}
                                >
                                  {name}
                                </NTag>
                              </NButton>
                            )
                          },
                          default() {
                            return (
                              <NCard
                                bordered={false}
                                title={name}
                                class="max-h-[50vh] max-w-[40vw] overflow-auto"
                              >
                                <CodeHighlight
                                  code={raw}
                                  language={'typescript'}
                                />
                              </NCard>
                            )
                          },
                        }}
                      </NPopover>
                    ),
                  )}
                </div>
              </NFormItem>

              <NFormItem label="将安装的依赖：">
                <div class={'space-x-2'}>
                  {dependencies.value.map((dependency, index) => (
                    <NTag
                      closable
                      key={dependency}
                      onClose={() => {
                        dependencies.value.splice(index, 1)
                      }}
                    >
                      {dependency}
                    </NTag>
                  ))}
                </div>
              </NFormItem>

              <div class="flex justify-end">
                <NButton round type="primary" onClick={handleSubmit}>
                  导入
                </NButton>
              </div>
            </NForm>
          )}

          <InstallDepsXterm ref={$installDepsComponent} />
        </div>
      )
    }
  },
})
