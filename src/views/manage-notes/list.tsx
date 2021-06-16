import { Add12Filled, Delete16Regular } from '@vicons/fluent'
import { defineComponent, onMounted } from '@vue/runtime-core'
import { Table } from 'components/table'
import { RelativeTime } from 'components/time/relative-time'
import { useTable } from 'hooks/use-table'
import {
  NButton,
  NInput,
  NPopconfirm,
  NSpace,
  useDialog,
  useMessage,
} from 'naive-ui'
import { TableColumns } from 'naive-ui/lib/data-table/src/interface'
import { parseDate, relativeTimeFromNow } from 'utils/time'
import { PropType, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { PostResponse } from '../../models/post'
import { RESTManager } from '../../utils/rest'
export const ManageNoteListView = defineComponent({
  name: 'note-list',
  setup({}, ctx) {
    const { checkedRowKeys, data, pager, sortProps, fetchDataFn } = useTable(
      (data, pager) => async (page = route.query.page || 1, size = 20) => {
        const response = await RESTManager.api.notes.get<PostResponse>({
          params: {
            page,
            size,
            select: 'title _id id created modified mood weather',
            ...(sortProps.sortBy
              ? { sortBy: sortProps.sortBy, sortOrder: sortProps.sortOrder }
              : {}),
          },
        })
        data.value = response.data
        pager.value = response.page
      },
    )

    const message = useMessage()
    const dialog = useDialog()

    const route = useRoute()
    const fetchData = fetchDataFn
    watch(
      () => route.query.page,
      async n => {
        // @ts-expect-error
        await fetchData(n)
      },
    )

    onMounted(async () => {
      await fetchData()
    })

    const DataTable = defineComponent({
      setup() {
        const columns = reactive<TableColumns<any>>([
          {
            type: 'selection',
            options: ['all', 'none'],
          },
          {
            title: '标题',
            sortOrder: false,
            sorter: 'default',
            key: 'title',
            width: 300,
            render(row) {
              return (
                <RouterLink to={'/notes/edit?id=' + row.id}>
                  {row.title}
                </RouterLink>
              )
            },
          },
          {
            title: '心情',
            key: 'mood',
            width: 200,
            render(row, index) {
              return (
                <EditColumn
                  initialValue={data.value[index].mood}
                  onSubmit={async v => {
                    console.log(v)

                    await RESTManager.api.notes(row.id).put({
                      data: {
                        mood: v,
                      },
                    })

                    message.success('修改成功')
                    data.value[index].mood = v
                  }}
                  placeholder="心情"
                />
              )
            },
          },
          {
            title: '天气',
            key: 'weather',
            width: 200,
            render(row, index) {
              return (
                <EditColumn
                  initialValue={data.value[index].weather}
                  onSubmit={async v => {
                    await RESTManager.api.notes(row.id).put({
                      data: {
                        weather: v,
                      },
                    })
                    message.success('修改成功')
                    data.value[index].weather = v
                    console.log(data.value[index].weather)
                  }}
                  placeholder="天气"
                />
              )
            },
          },

          {
            title: '创建时间',
            key: 'created',
            sortOrder: 'descend',
            sorter: 'default',
            render(row) {
              return <RelativeTime time={row.created} />
            },
          },
          {
            title: '修改于',
            key: 'modified',
            sorter: 'default',
            sortOrder: false,
            render(row) {
              return parseDate(row.modified, 'yyyy年M月d日')
            },
          },
          {
            title: '操作',
            key: 'id',
            render(row) {
              return (
                <NSpace>
                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={async () => {
                      await RESTManager.api.notes(row.id).delete()
                      message.success('删除成功')
                      await fetchData(pager.value.currentPage)
                    }}
                  >
                    {{
                      trigger: () => (
                        <NButton text type="error">
                          移除
                        </NButton>
                      ),

                      default: () => (
                        <span style={{ maxWidth: '12rem' }}>
                          确定要删除 {row.title} ?
                        </span>
                      ),
                    }}
                  </NPopconfirm>
                </NSpace>
              )
            },
          },
        ])

        return () => (
          <Table
            columns={columns}
            data={data}
            onFetchData={fetchData}
            pager={pager}
            onUpdateCheckedRowKeys={keys => {
              checkedRowKeys.value = keys
            }}
            onUpdateSorter={async props => {
              sortProps.sortBy = props.sortBy
              sortProps.sortOrder = props.sortOrder
            }}
          ></Table>
        )
      },
    })

    return () => {
      return (
        <ContentLayout>
          {{
            actions: () => (
              <>
                <HeaderActionButton
                  variant="error"
                  disabled={checkedRowKeys.value.length == 0}
                  onClick={() => {
                    dialog.warning({
                      title: '警告',
                      content: '你确定要删除？',
                      positiveText: '确定',
                      negativeText: '不确定',
                      onPositiveClick: async () => {
                        for (const id of checkedRowKeys.value) {
                          await RESTManager.api.notes(id as string).delete()
                        }
                        checkedRowKeys.value.length = 0
                        message.success('删除成功')

                        await fetchData()
                      },
                    })
                  }}
                  icon={<Delete16Regular />}
                />
                <HeaderActionButton to={'/notes/edit'} icon={<Add12Filled />} />
              </>
            ),
            default: () => <DataTable />,
          }}
        </ContentLayout>
      )
    }
  },
})

const EditColumn = defineComponent({
  props: {
    initialValue: {
      type: String,
      required: true,
    },
    onSubmit: {
      type: Function as PropType<(value: string) => void>,
      required: true,
    },
    placeholder: {
      type: String,
    },
  },
  setup(props) {
    const { onSubmit, placeholder } = props
    const value = ref(props.initialValue)
    watch(
      () => props.initialValue,
      n => {
        value.value = n
      },
    )

    const isEdit = ref(false)
    const inputRef = ref<HTMLInputElement>()

    watch(
      () => isEdit.value,
      n => {
        if (n) {
          requestAnimationFrame(() => {
            inputRef.value?.focus()
          })
        }
      },
    )
    const handleSubmit = () => {
      onSubmit(value.value)
      isEdit.value = false
    }
    return () => (
      <>
        {isEdit.value ? (
          <NSpace align="center" wrap={false}>
            <NInput
              onKeydown={e => {
                if (e.key == 'Enter') {
                  handleSubmit()
                }
              }}
              class="w-3/4"
              value={value.value}
              placeholder={placeholder ?? props.initialValue}
              size="small"
              autofocus
              ref={inputRef}
              onBlur={() => {
                isEdit.value = false
              }}
              onInput={e => {
                value.value = e
              }}
            ></NInput>
          </NSpace>
        ) : (
          <button
            class="w-full text-left"
            onClick={() => {
              isEdit.value = true
            }}
          >
            {props.initialValue}&nbsp;
          </button>
        )}
      </>
    )
  },
})
