import { AddIcon } from 'components/icons'
import { TableTitleLink } from 'components/link/title-link'
import type { PageModel, PageResponse } from 'models/page'
import {
  NButton,
  NCard,
  NPopconfirm,
  NSpace,
  NText,
  useMessage,
} from 'naive-ui'
import Sortable, { Swap } from 'sortablejs'
import type { PropType } from 'vue'
import { defineComponent, onMounted } from 'vue'

import { RelativeTime } from '~/components/time/relative-time'

import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'

Sortable.mount(new Swap())

const PostItem = defineComponent({
  name: 'PostItem',
  props: {
    data: {
      type: Object as PropType<PageModel>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const row = props.data
      return (
        <NCard size="small">
          {{
            header() {
              return (
                <TableTitleLink
                  inPageTo={`/pages/edit?id=${row.id}`}
                  title={row.title}
                  externalLinkTo={`/${row.slug}`}
                  id={row.id}
                />
              )
            },
            ['header-extra']: function () {
              return <RelativeTime time={row.created} />
            },

            default() {
              return (
                <NText depth={1} class={'min-h-[1rem]'}>
                  {row.subtitle}
                </NText>
              )
            },
            footer() {
              return <NText depth={3}>{`/${row.slug}`}</NText>
            },
            action() {
              return (
                <NSpace justify="end">
                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={async () => {
                      await RESTManager.api.pages(row.id).delete()
                      message.success('删除成功')
                      props.onDelete(row.id)
                    }}
                  >
                    {{
                      trigger: () => (
                        <NButton text type="error" size="tiny">
                          移除
                        </NButton>
                      ),

                      default: () => (
                        <span class="max-w-48">
                          确定要删除「{row.title}」？
                        </span>
                      ),
                    }}
                  </NPopconfirm>
                </NSpace>
              )
            },
          }}
        </NCard>
      )
    }
  },
})

const reorder = (data: any[], oldIndex: number, newIndex: number) => {
  const result = Array.from(data)
  const [removed] = result.splice(oldIndex, 1)
  result.splice(newIndex, 0, removed)
  return result
}
export const ManagePageListView = defineComponent({
  name: 'PageList',
  setup() {
    const data = ref<PageModel[]>([])
    onMounted(async () => {
      const response = await RESTManager.api.pages.get<PageResponse>({
        params: {
          page: 1,
          size: 20,
          select: 'title subtitle _id id created modified slug',
        },
      })
      data.value = response.data
    })

    const message = useMessage()

    const wrapperRef = ref<HTMLDivElement>()
    let sortable: Sortable | null = null
    watchOnce(
      () => data.value,
      () => {
        if (data.value.length === 0) return

        requestAnimationFrame(() => {
          if (!wrapperRef.value) return
          sortable = new Sortable(wrapperRef.value, {
            animation: 150,

            onEnd(evt) {
              if (
                typeof evt.oldIndex === 'undefined' ||
                typeof evt.newIndex === 'undefined'
              )
                return
              if (evt.oldIndex === evt.newIndex) return

              const reorderData = reorder(
                data.value,
                evt.oldIndex,
                evt.newIndex,
              )
              data.value = reorderData

              RESTManager.api.pages.reorder
                .patch({
                  data: {
                    seq: [...reorderData]
                      .reverse()
                      .map((item, idx) => ({ id: item.id, order: idx + 1 })),
                  },
                })
                .then(() => {
                  message.success('排序成功')
                })
            },
          })
        })
      },
    )
    onBeforeUnmount(() => sortable?.destroy())

    return () => {
      return (
        <ContentLayout>
          {{
            actions: () => (
              <>
                <HeaderActionButton to={'/pages/edit'} icon={<AddIcon />} />
              </>
            ),
            default: () => (
              <div
                class={
                  'gap-4 grid phone:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 children:flex children:flex-1'
                }
                ref={wrapperRef}
              >
                {data.value.map((item) => (
                  <PostItem
                    data={item}
                    key={item.id}
                    onDelete={(id) => {
                      data.value = data.value
                        .filter((item) => item.id !== id)
                        .concat()
                    }}
                  />
                ))}
              </div>
            ),
          }}
        </ContentLayout>
      )
    }
  },
})
