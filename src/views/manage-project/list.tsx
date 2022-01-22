import { AddIcon, DeleteIcon, MenuDownIcon } from 'components/icons'
import { RelativeTime } from 'components/time/relative-time'
import { useTable } from 'hooks/use-table'
import { ProjectModel, ProjectResponse } from 'models/project'
import {
  NAvatar,
  NButton,
  NButtonGroup,
  NCheckbox,
  NElement,
  NIcon,
  NList,
  NListItem,
  NPagination,
  NPopselect,
  NSpace,
  NThing,
  useDialog,
  useMessage,
} from 'naive-ui'
import { router } from 'router'
import { RouteName } from 'router/name'
import { parseDate } from 'utils'
import { defineComponent, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'
const ManageProjectView = defineComponent({
  setup(props, ctx) {
    const { data, pager, sortProps, fetchDataFn } = useTable<ProjectModel>(
      (data, pager) =>
        async (page = route.query.page || 1, size = 30) => {
          const response = await RESTManager.api.projects.get<ProjectResponse>({
            params: {
              page,
              size,
            },
          })
          data.value = response.data
          pager.value = response.pagination
        },
    )

    const checkedRowKeys = reactive(new Set<string>())

    const message = useMessage()
    const dialog = useDialog()

    const route = useRoute()
    const fetchData = fetchDataFn
    watch(
      () => route.query.page,
      async (n) => {
        // @ts-expect-error
        await fetchData(n)
      },
    )

    onMounted(async () => {
      await fetchData()
    })

    return () => {
      return (
        <ContentLayout>
          {{
            actions: () => (
              <>
                <HeaderActionButton
                  variant="error"
                  disabled={checkedRowKeys.size == 0}
                  onClick={() => {
                    dialog.warning({
                      title: '警告',
                      content: '你确定要删除？',
                      positiveText: '确定',
                      negativeText: '不确定',
                      onPositiveClick: async () => {
                        await Promise.all(
                          Array.from(checkedRowKeys.values()).map((id) => {
                            return RESTManager.api
                              .projects(id as string)
                              .delete()
                          }),
                        )
                        checkedRowKeys.clear()
                        message.success('删除成功')

                        await fetchData()
                      },
                    })
                  }}
                  icon={<DeleteIcon />}
                />
                <HeaderActionButton to={'/projects/edit'} icon={<AddIcon />} />
              </>
            ),
            default: () => (
              <NList bordered={false}>
                {{
                  footer() {
                    return (
                      <div class="flex justify-end">
                        <NPagination
                          itemCount={pager.value.total}
                          pageCount={pager.value.totalPage}
                          page={pager.value.currentPage}
                          pageSize={pager.value.size}
                          onUpdatePage={(page) => {
                            fetchData(page)
                          }}
                        ></NPagination>
                      </div>
                    )
                  },
                  default() {
                    return data.value.map((item) => {
                      return (
                        <NListItem key={item.id}>
                          {{
                            prefix() {
                              return (
                                <NCheckbox
                                  checked={checkedRowKeys.has(item.id)}
                                  onUpdateChecked={(checked) => {
                                    if (checked) {
                                      checkedRowKeys.add(item.id)
                                    } else {
                                      checkedRowKeys.delete(item.id)
                                    }
                                  }}
                                ></NCheckbox>
                              )
                            },

                            default() {
                              return (
                                <NThing
                                  title={item.name}
                                  description={item.description}
                                >
                                  {{
                                    footer() {
                                      return (
                                        <NElement>
                                          <NSpace class="pl-[3.6rem] text-[var(--clear-color-pressed)] text-sm">
                                            <span>
                                              创建于 {parseDate(item.created)}
                                            </span>

                                            {item.modified && (
                                              <span>
                                                更新于{' '}
                                                <RelativeTime
                                                  time={item.modified}
                                                />
                                              </span>
                                            )}
                                          </NSpace>
                                        </NElement>
                                      )
                                    },
                                    'header-extra'() {
                                      return (
                                        <NButtonGroup>
                                          <NButton
                                            onClick={() => {
                                              router.push({
                                                name: RouteName.EditProject,
                                                query: { id: item.id },
                                              })
                                            }}
                                          >
                                            编辑
                                          </NButton>
                                          <NPopselect
                                            class="!p-0"
                                            options={[
                                              {
                                                value: 'del',
                                                label: '',
                                                render() {
                                                  return (
                                                    <NButton
                                                      type="error"
                                                      bordered={false}
                                                      onClick={async () => {
                                                        await RESTManager.api
                                                          .projects(item.id)
                                                          .delete()
                                                        message.success(
                                                          '删除成功',
                                                        )
                                                        await fetchData(
                                                          pager.value
                                                            .currentPage,
                                                        )
                                                      }}
                                                    >
                                                      删除
                                                    </NButton>
                                                  )
                                                },
                                              },
                                            ]}
                                          >
                                            <NButton class="!px-2">
                                              <NIcon>
                                                <MenuDownIcon />
                                              </NIcon>
                                            </NButton>
                                          </NPopselect>
                                        </NButtonGroup>
                                      )
                                    },
                                    avatar() {
                                      return item.avatar ? (
                                        <NAvatar
                                          circle
                                          src={item.avatar}
                                          size="large"
                                        ></NAvatar>
                                      ) : (
                                        <NAvatar circle size="large">
                                          {item.name[0].toUpperCase()}
                                        </NAvatar>
                                      )
                                    },
                                  }}
                                </NThing>
                              )
                            },
                          }}
                        </NListItem>
                      )
                    })
                  },
                }}
              </NList>
            ),
          }}
        </ContentLayout>
      )
    }
  },
})

export default ManageProjectView

// const DataTable = defineComponent({
//   setup() {
//     const columns = reactive<TableColumns<any>>([
//       {
//         type: 'selection',
//         options: ['none', 'all'],
//       },
//       {
//         title: '项目名称',
//         key: 'name',
//         width: 100,
//         render(row) {
//           const hasLink = [row.previewUrl, row.projectUrl, row.docUrl]
//             .filter(Boolean)
//             .find((i) => isURL(i, { require_protocol: true }))
//           return hasLink ? (
//             <a href={hasLink} target={'_blank'} rel="noreferrer">
//               {row.name}
//             </a>
//           ) : (
//             <NText>{row.name}</NText>
//           )
//         },
//       },
//       {
//         title: '项目描述',
//         key: 'description',
//       },
//       {
//         title: '创建时间',
//         key: 'created',

//         render(row) {
//           return parseDate(row.created)
//         },
//       },
//       {
//         title: '修改于',
//         key: 'created',

//         render(row) {
//           return <RelativeTime time={row.created} />
//         },
//       },
//       {
//         title: '操作',
//         fixed: 'right',
//         key: 'id',
//         width: 130,
//         render(row) {
//           return (
//             <NSpace wrap={false}>
//               <RouterLink
//                 to={{ name: RouteName.EditProject, query: { id: row.id } }}
//               >
//                 <NButton text type="primary" size="tiny">
//                   编辑
//                 </NButton>
//               </RouterLink>
//               <NPopconfirm
//                 positiveText={'取消'}
//                 negativeText="删除"
//                 onNegativeClick={async () => {
//                   await RESTManager.api.projects(row.id).delete()
//                   message.success('删除成功')
//                   await fetchData(pager.value.currentPage)
//                 }}
//               >
//                 {{
//                   trigger: () => (
//                     <NButton text type="error" size="tiny">
//                       移除
//                     </NButton>
//                   ),

//                   default: () => (
//                     <span style={{ maxWidth: '12rem' }}>
//                       确定要删除项目 [{row.name}] ?
//                     </span>
//                   ),
//                 }}
//               </NPopconfirm>
//             </NSpace>
//           )
//         },
//       },
//     ])

//     return () => (
//       <Table
//         columns={columns}
//         data={data}
//         onFetchData={fetchData}
//         pager={pager}
//         onUpdateCheckedRowKeys={(keys) => {
//           checkedRowKeys.value = keys
//         }}
//       ></Table>
//     )
//   },
// })
