import { format } from 'date-fns'
import {
  NButton,
  NButtonGroup,
  NEmpty,
  NFlex,
  NIcon,
  NInput,
  NList,
  NListItem,
  NPagination,
  NSpace,
  useDialog,
} from 'naive-ui'
import useSWRV from 'swrv'
import { RouterLink, useRoute } from 'vue-router'
import type { CollectionRefTypes, PaginateResult } from '@mx-space/api-client'
import type { AISummaryModel } from '~/models/ai'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { AddIcon, TrashIcon } from '~/components/icons'
import { ContentLayout, useLayout } from '~/layouts/content'
import { RESTManager } from '~/utils'

export default defineComponent({
  setup() {
    const route = useRoute()

    return () => {
      const refId = route.query.refId as string
      return (
        <ContentLayout>
          {refId ? <SummaryRefIdContent refId={refId} /> : <Summaries />}
        </ContentLayout>
      )
    }
  },
})

const Summaries = defineComponent({
  setup() {
    const pageRef = ref(1)
    const { data, mutate } = useSWRV(
      '/api/ai/summaries',
      async () => {
        return await RESTManager.api.ai.summaries.get<
          PaginateResult<AISummaryModel> & {
            articles: Record<
              string,
              {
                title: string
                type: CollectionRefTypes
                id: string
              }
            >
          }
        >({
          params: {
            page: pageRef.value,
          },
        })
      },
      {
        revalidateOnFocus: false,
      },
    )
    return () => {
      if (data.value?.data.length === 0) {
        return <NEmpty />
      }

      return (
        <>
          <List
            summaries={data.value?.data || []}
            getArticle={(id) => {
              const article = data.value?.articles[id]
              if (!article) throw new Error('article not found')

              return {
                type: article.type,
                document: {
                  title: article.title,
                },
              }
            }}
            mutate={mutate}
          />
          <NSpace class={'mt-6'} justify="end">
            <NPagination
              page={data.value?.pagination.currentPage}
              pageCount={data.value?.pagination.totalPage}
              onUpdatePage={(page) => {
                pageRef.value = page

                mutate()
              }}
            />
          </NSpace>
        </>
      )
    }
  },
})

const SummaryRefIdContent = defineComponent({
  props: {
    refId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const refId = props.refId
    const { data, mutate } = useSWRV(`/api/ai/summary/${refId}`, async () => {
      return await RESTManager.api.ai.summaries.ref(refId).get<{
        summaries: AISummaryModel[]
        article: {
          type: CollectionRefTypes
          document: { title: string }
        }
      }>()
    })
    const dialog = useDialog()

    const { setHeaderButtons } = useLayout()

    setHeaderButtons(
      <HeaderActionButton
        icon={<AddIcon />}
        name="生成摘要"
        onClick={() => {
          const $dialog = dialog.create({
            title: '生成摘要',
            content() {
              const Content = defineComponent({
                setup() {
                  const loadingRef = ref(false)
                  return () => (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()

                        const $form = e.target as HTMLFormElement
                        const lang = (
                          $form.querySelector(
                            'input[name=lang]',
                          ) as HTMLInputElement
                        )?.value
                        if (!lang) {
                          return
                        }

                        loadingRef.value = true
                        RESTManager.api
                          .ai('generate-summary')
                          .post<AISummaryModel | null>({
                            data: {
                              refId,
                            },
                          })
                          .then((res) => {
                            res && data.value?.summaries.push(res)
                            $dialog.destroy()
                          })
                          .finally(() => {
                            loadingRef.value = false
                          })
                      }}
                    >
                      <NInput
                        type="text"
                        inputProps={{ name: 'lang' }}
                        defaultValue={'zh-CN'}
                        placeholder="目标语言"
                      />

                      <div class={'mt-4 text-right'}>
                        <NButton
                          attrType="submit"
                          loading={loadingRef.value}
                          round
                          type="primary"
                        >
                          生成
                        </NButton>
                      </div>
                    </form>
                  )
                },
              })
              return <Content />
            },
          })
        }}
      />,
    )

    onUnmounted(() => {
      setHeaderButtons(null)
    })

    return () => {
      if (!data.value || data.value.summaries.length === 0) {
        return <NEmpty />
      }

      return (
        <List
          summaries={data.value?.summaries || []}
          getArticle={() => data.value!.article}
          mutate={mutate}
        />
      )
    }
  },
})

const List = defineComponent({
  props: {
    summaries: {
      type: Array as PropType<AISummaryModel[]>,
      required: true,
    },

    getArticle: {
      type: Function as PropType<
        (id: string) => {
          type: CollectionRefTypes
          document: { title: string }
        }
      >,
      required: true,
    },

    mutate: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <NList bordered showDivider>
        {props.summaries.map((item) => (
          <NListItem class={'ml-2'} key={item.id}>
            {{
              suffix() {
                return (
                  <NButtonGroup>
                    <NButton
                      onClick={() => {
                        const $dialog = dialog.create({
                          title: '修改摘要',
                          content() {
                            return (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault()

                                  const $form = e.target as HTMLFormElement
                                  const summary =
                                    $form.querySelector('textarea')?.value
                                  if (!summary) {
                                    return
                                  }
                                  RESTManager.api.ai
                                    .summaries(item.id)
                                    .patch({ data: { summary } })
                                    .then(() => {
                                      props.mutate()
                                      $dialog.destroy()
                                    })
                                }}
                              >
                                <NFlex vertical>
                                  <NInput
                                    inputProps={{
                                      name: 'summary',
                                    }}
                                    rows={6}
                                    type="textarea"
                                    defaultValue={item.summary}
                                  />

                                  <div class={'text-right'}>
                                    <NButton
                                      type="primary"
                                      attrType="submit"
                                      round
                                    >
                                      保存
                                    </NButton>
                                  </div>
                                </NFlex>
                              </form>
                            )
                          },
                        })
                      }}
                      round
                    >
                      修改
                    </NButton>
                    <NButton
                      onClick={() => {
                        const $dialog = dialog.create({
                          title: '确定？',
                          content: '确定要删除吗？',
                          type: 'error',
                          positiveText: '删除',
                          negativeText: '取消',
                          onPositiveClick() {
                            RESTManager.api.ai
                              .summaries(item.id)
                              .delete()
                              .then(() => {
                                props.mutate()
                                $dialog.destroy()
                              })
                          },
                        })
                      }}
                      round
                      type="error"
                    >
                      <NIcon>
                        <TrashIcon class={'text-white'} />
                      </NIcon>
                    </NButton>
                  </NButtonGroup>
                )
              },
              default() {
                const article = props.getArticle(item.refId)
                return (
                  <>
                    <RouterLink to={`/${article.type}/edit?id=${item.refId}`}>
                      <h2 data-article-id={item.refId}>
                        {article.document.title}
                      </h2>
                    </RouterLink>
                    <small>
                      目标语言：{item.lang} /{' '}
                      {format(new Date(item.created), 'yyyy-MM-dd HH:mm')}
                    </small>
                    <p class={'mt-2'}>{item.summary}</p>
                  </>
                )
              },
            }}
          </NListItem>
        ))}
      </NList>
    )
  },
})
