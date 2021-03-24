import { defineComponent, onMounted, ref } from '@vue/runtime-core'
import { ContentLayout } from '../../layouts/content'
import DataTable from 'primevue/datatable'
import { RESTManager } from '../../utils/rest'
import { Pager, PostModel, PostResponse } from '../../models/post'
import Column from 'primevue/column'
import { ElTable, ElTableColumn } from 'element-plus'
// import ElTableColumn from 'element-plus/lib/el-table/src/tableColumn'
export const ManagePostListView = defineComponent({
  name: 'post-list',
  setup({}, ctx) {
    const data = ref<PostModel[]>([])
    const pager = ref<Pager>({} as any)
    const fetchData = async (page = 1) => {
      const {
        data: $$,
        page: $_,
      } = await RESTManager.api.posts.get<PostResponse>({
        params: {
          page,
        },
      })
      data.value = $$
      pager.value = $_
    }
    onMounted(() => {
      fetchData()
    })

    return () => {
      return (
        <ContentLayout>
          <ElTable data={data.value}>
            <ElTableColumn prop="title" label="标题"></ElTableColumn>
          </ElTable>
          {/* <DataTable
            responsiveLayout="scroll"
            value={data.value}
            v-slots={{ footer: () => <span>aaaaaaaaa</span> }}
          >
            <Column field="title" header="标题" sortable={true} />
            {/* <Column field="created" header="创建于" sortable={true} /
          </DataTable> */}
        </ContentLayout>
      )
    }
  },
})
