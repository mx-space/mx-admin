/**
 * 最近 & 速记
 */
import Add12Filled from '@vicons/fluent/es/Add12Filled'
import { useShorthand } from 'components/shorthand'
import { RecentlyModel } from 'models/recently'
import { NButton, NDataTable, NPopconfirm, NSpace } from 'naive-ui'
import { parseDate } from 'utils'
import { defineComponent, onMounted } from 'vue'
import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'

export default defineComponent({
  setup() {
    const data = ref([] as RecentlyModel[])
    const loading = ref(true)
    onMounted(async () => {
      RESTManager.api.recently.all
        .get<{ data: RecentlyModel[] }>()
        .then((res) => {
          data.value = res.data
          loading.value = false
        })
    })
    const { create } = useShorthand()
    return () => (
      <ContentLayout
        actionsElement={
          <>
            <HeaderActionButton
              onClick={() => {
                create().then((res) => {
                  if (res) {
                    data.value.unshift(res)
                  }
                })
              }}
              icon={<Add12Filled />}
            />
          </>
        }
      >
        <NDataTable
          remote
          loading={loading.value}
          bordered={false}
          data={data.value}
          columns={[
            {
              title: '内容',
              key: 'content',
              width: 500,
              // ellipsis: {
              //   tooltip: true,
              // },
            },
            {
              title: '记录时间',
              key: 'created',
              width: 100,
              render(row) {
                return parseDate(row.created, 'M-d HH:mm:ss')
              },
            },
            {
              title: '操作',
              fixed: 'right',
              width: 60,
              key: 'id',
              render(row) {
                return (
                  <NSpace>
                    <NPopconfirm
                      positiveText={'取消'}
                      negativeText="删除"
                      onNegativeClick={async () => {
                        await RESTManager.api.recently(row.id).delete()
                        message.success('删除成功')
                        data.value.splice(data.value.indexOf(row), 1)
                      }}
                    >
                      {{
                        trigger: () => (
                          <NButton text type="error" size="tiny">
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
          ]}
        ></NDataTable>
      </ContentLayout>
    )
  },
})
