<template>
  <DataTable
    responsiveLayout="scroll"
    :value="data"
    filterDisplay="menu"
    v-model:filters="filters1"
    :globalFilterFields="['category']"
  >
    <Column
      field="title"
      header="标题"
      :sortable="true"
      style="min-width: 10rem"
    >
      <template #body="slot">
        <router-link :to="'/posts/edit?id=' + slot.data._id">
          {{ slot.data.title }}
        </router-link>
      </template>
    </Column>
    <Column
      field="category.name"
      header="分类"
      style="min-width: 4rem"
      filterField="category"
    >
      <template #filter="{ filterModel, filterCallback }">
        <div class="p-mb-3 p-text-bold">Agent Picker</div>
        <!-- <MultiSelect v-model="filterModel.value" @change="filterCallback">
          <template #option="slotProps">
            <div class="p-multiselect-representative-option">
              <span class="image-text">{{ slotProps.option.name }}</span>
            </div>
          </template>
        </MultiSelect> -->
      </template>
    </Column>
    <Column
      field="created"
      header="创建于"
      :sortable="true"
      style="min-width: 8rem"
    >
      <template #body="slot">
        <span>
          {{ rt(slot.data.created) }}
        </span>
      </template>
    </Column>
    <Column
      field="created"
      header="修改于"
      :sortable="true"
      style="min-width: 12rem"
    >
      <template #body="slot">
        <span>
          {{ ft(slot.data.modified) }}
        </span>
      </template>
    </Column>
    <Column header="操作" style="min-width: 8rem">
      <template #body="slot">
        <Button class="p-button-text p-button-danger">移除</Button>
      </template>
    </Column>
  </DataTable>
  <Paginator
    :rows="10"
    :totalRecords="pager.total"
    @page="onPage($event)"
  ></Paginator>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, ref } from '@vue/runtime-core'
import { Category, Pager, PostModel } from '../../../models/post'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { parseDate, relativeTimeFromNow } from '../../../utils/time'
import Button from 'primevue/button'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import Paginator from 'primevue/paginator'
import MultiSelect from 'primevue/multiselect'
import { RESTManager } from '../../../utils/rest'
export default defineComponent({
  components: {
    DataTable,
    Column,
    Button,
    FontAwesomeIcon,
    Paginator,
    MultiSelect,
  },
  props: {
    data: {
      type: Array as PropType<PostModel[]>,
      required: true,
    },
    pager: {
      type: Object as PropType<Pager>,
      required: true,
    },
    onChange: {
      type: Function as PropType<(page: number) => void>,
      required: true,
    },
  },
  setup() {
    const categories = ref<Category[]>([])
    onMounted(async () => {
      const { data } = await RESTManager.api.categories.get<any>()
      categories.value = data
    })
    const categoryFilter = ref()
    return {
      categoryFilter,
      categories,
    }
  },
  computed: {
    rt() {
      return relativeTimeFromNow
    },
    ft() {
      return parseDate
    },
    icons() {
      return {
        plus: faPlus,
      }
    },
  },
  methods: {
    onPage(event) {
      //event.page: New page number
      //event.first: Index of first record
      //event.rows: Number of rows to display in new page
      //event.pageCount: Total number of pages
      // TODO: it is a bug?
      const newPage = event.page + 1
      this.$props.onChange(newPage)
    },
  },
})
</script>

<style scoped>
.row {
  @apply px-0;
}
</style>
