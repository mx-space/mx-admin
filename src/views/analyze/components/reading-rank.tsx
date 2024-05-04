import { add } from 'date-fns'
import { NButton, NDataTable, NDatePicker, NSpace } from 'naive-ui'
import useSWRV from 'swrv'
import { defineComponent, ref } from 'vue'
import { RESTManager } from '~/utils'
import type {
  NoteModel,
  PageModel,
  PostModel,
  RecentlyModel,
} from '@mx-space/api-client'

export const ReadingRank = defineComponent({
  setup() {
    const dateRange = ref([+add(new Date(), { days: -7 }), Date.now()] as [
      number,
      number,
    ])
    const { data, mutate } = useSWRV('/reading/rank', async () => {
      return RESTManager.api.activity.reading.rank
        .get<{
          data: {
            ref: Partial<PostModel | NoteModel | PageModel | RecentlyModel>
            refId: string
            count: number
          }[]
        }>({
          params: {
            start: dateRange.value[0],
            end: dateRange.value[1],
          },
        })
        .then(({ data }) => {
          return data
        })
    })

    watch(dateRange, () => {
      mutate()
    })

    return () => {
      return (
        <>
          <div class={'mb-6 flex items-center gap-4'}>
            <span>时间范围</span>
            <NDatePicker
              class={'w-[400px]'}
              type="datetimerange"
              clearable
              value={dateRange.value}
              onUpdateValue={(range) => {
                dateRange.value = range as [number, number]
              }}
            >
              {{
                footer: () => {
                  const date = new Date()
                  return (
                    <NSpace>
                      <NButton
                        round
                        type="default"
                        size="small"
                        onClick={() => {
                          const now = new Date()
                          dateRange.value = [
                            +add(now, {
                              days: -1,
                            }),
                            +now,
                          ]
                        }}
                      >
                        一天之内
                      </NButton>
                      <NButton
                        round
                        type="default"
                        size="small"
                        onClick={() => {
                          dateRange.value = [
                            +add(date, {
                              days: -7,
                            }),
                            +date,
                          ]
                        }}
                      >
                        一周之内
                      </NButton>
                    </NSpace>
                  )
                },
              }}
            </NDatePicker>
          </div>
          <NDataTable
            remote
            class={'min-h-[500px]'}
            data={data.value}
            columns={[
              {
                key: 'ref',
                title: '文章标题',
                render: (row: { ref: { id: string; title: string } }) => {
                  return (
                    <NButton
                      quaternary
                      type="primary"
                      size="tiny"
                      onClick={() => {
                        RESTManager.api
                          .helper('url-builder')(row.ref.id)
                          .get<{ data: string }>()
                          .then(({ data: url }) => {
                            window.open(url)
                          })
                      }}
                    >
                      {row.ref.title}
                    </NButton>
                  )
                },
              },
              {
                key: 'count',
                title: '阅读次数',
                width: 100,
              },
            ]}
          />
        </>
      )
    }
  },
})
