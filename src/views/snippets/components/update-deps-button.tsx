import { HeaderActionButton } from 'components/button/rounded-button'
import { UpgradeIcon } from 'components/icons'
import { getNpmPKGLatest } from 'external/api/npm'
import type { NpmPKGInfo } from 'external/types/npm-pkg'
import { NButton, NCard, NDataTable, NModal } from 'naive-ui'
import { RESTManager } from 'utils'

import { InstallDepsXterm } from './install-dep-xterm'

const useFetchDependencyGraph = () => {
  const dependencyGraph = ref<{ dependencies: Record<string, string> }>({
    dependencies: {},
  })
  const fetchDependencyGraph = async () => {
    const data = await RESTManager.api.dependencies.graph.get<any>({
      transform: false,
    })

    dependencyGraph.value = { ...data }
  }

  return {
    dependencyGraph,
    fetchDependencyGraph,
  }
}

const cacheRef = ref<Record<string, NpmPKGInfo>>({})

const fetchLastestNPMPackageInfo = async (packageName: string) => {
  if (cacheRef.value[packageName]) {
    return Promise.resolve(cacheRef.value[packageName])
  }

  const data = await getNpmPKGLatest(packageName)
  cacheRef.value[packageName] = data
  return data
}

export const UpdateDependencyButton = defineComponent({
  name: 'UpdateDependencyButton',
  setup() {
    const modalShow = ref(false)

    const { dependencyGraph, fetchDependencyGraph } = useFetchDependencyGraph()
    // 做了一下 cache

    const cleaner = watch(
      () => modalShow.value,
      () => {
        if (modalShow.value) {
          fetchDependencyGraph().then(() => {
            cleaner()
          })
        }
      },
    )

    const $installDepsComponent = ref<InstanceType<typeof InstallDepsXterm>>()

    onBeforeUnmount(() => {
      cacheRef.value = {}
    })
    return () => {
      const nameToVersionMap = [
        ...Object.entries(dependencyGraph.value.dependencies).map(
          ([pkg, version]) => ({
            package: pkg,
            version,
          }),
        ),
      ]

      return (
        <>
          <HeaderActionButton
            icon={<UpgradeIcon />}
            name="更新依赖"
            onClick={() => {
              modalShow.value = true
            }}
          />

          <NModal
            show={modalShow.value}
            onUpdateShow={(show) => {
              modalShow.value = show
            }}
          >
            <NCard class={'modal-card sm'} title="依赖更新">
              <NDataTable
                bordered
                virtualScroll
                maxHeight={600}
                data={nameToVersionMap}
                columns={[
                  {
                    key: 'package',
                    title: '包名',
                    width: 180,
                    ellipsis: {
                      lineClamp: 2,
                      tooltip: true,
                    },
                    render(row) {
                      return (
                        <a
                          href={`https://npmjs.com/package/${row.package}`}
                          target="_blank"
                        >
                          {row.package}
                        </a>
                      )
                    },
                  },
                  {
                    key: 'version',
                    title: '版本',
                    width: 100,
                  },
                  {
                    key: 'latest',
                    title: '最新',
                    width: 100,
                    render(row) {
                      const ClosureComponent = defineComponent({
                        setup() {
                          const $ref = ref<HTMLDivElement>()
                          // FIXME maybe cost lots of memory
                          const isInView = useElementVisibility($ref)

                          const latestInfo = ref<NpmPKGInfo | null>(null)

                          const cleaner = watch(
                            () => isInView.value,
                            (inView) => {
                              if (inView) {
                                cleaner()
                                fetchLastestNPMPackageInfo(row.package).then(
                                  (data) => {
                                    latestInfo.value = data
                                  },
                                )
                              }
                            },
                          )

                          return () => (
                            <div ref={$ref}>
                              {latestInfo.value
                                ? latestInfo.value.version
                                : '...'}
                            </div>
                          )
                        },
                      })

                      return <ClosureComponent />
                    },
                  },
                  {
                    title: '操作',
                    key: '',
                    width: 80,
                    render(row) {
                      return (
                        <NButton
                          text
                          type="info"
                          onClick={() => {
                            fetchLastestNPMPackageInfo(row.package).then(
                              (data) => {
                                const latestVersion = data.version
                                const joint = `${row.package}@${latestVersion}`

                                // @ts-ignore
                                $installDepsComponent.value?.install(
                                  joint,
                                  () => {
                                    fetchDependencyGraph()
                                  },
                                )
                              },
                            )
                          }}
                        >
                          更新
                        </NButton>
                      )
                    },
                  },
                ]}
              />
            </NCard>
          </NModal>
          <InstallDepsXterm ref={$installDepsComponent} />
        </>
      )
    }
  },
})
