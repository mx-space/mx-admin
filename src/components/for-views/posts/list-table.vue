<template>
  <DataTable
    responsiveLayout="scroll"
    :value="data"
    filterDisplay="rows"
    :filters="null"
    :globalFilterFields="['category.name', 'title']"
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
      filterField="representative"
      :showFilterMenu="false"
      style="min-width: 4rem"
    >
      <template #filter="{ filterModel }">
        <div class="p-mb-3 p-text-bold">Agent Picker</div>
        <MultiSelect
          v-model="filterModel.value"
          :options="representatives"
          optionLabel="name"
          placeholder="Any"
          class="p-column-filter"
        >
          <template #option="slotProps">
            <div class="p-multiselect-representative-option">
              <img
                :alt="slotProps.option.name"
                :src="'demo/images/avatar/' + slotProps.option.image"
                width="32"
                style="vertical-align: middle"
              />
              <span class="image-text">{{ slotProps.option.name }}</span>
            </div>
          </template>
        </MultiSelect>
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
    <Column header="操作" style="min-width: 4rem">
      <template #body="slot">
        <Button class="p-button-text"> 移除 </Button>
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
import { defineComponent, PropType } from '@vue/runtime-core'
import { Pager, PostModel } from '../../../models/post'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { parseDate, relativeTimeFromNow } from '../../../utils/time'
import Button from 'primevue/button'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import Paginator from 'primevue/paginator'
import MultiSelect from 'primevue/multiselect'
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
    return {
      representatives: [
        { name: 'Amy Elsner', image: 'amyelsner.png' },
        { name: 'Anna Fali', image: 'annafali.png' },
        { name: 'Asiya Javayant', image: 'asiyajavayant.png' },
        { name: 'Bernardo Dominic', image: 'bernardodominic.png' },
        { name: 'Elwin Sharvill', image: 'elwinsharvill.png' },
        { name: 'Ioni Bowcher', image: 'ionibowcher.png' },
        { name: 'Ivan Magalhaes', image: 'ivanmagalhaes.png' },
        { name: 'Onyama Limba', image: 'onyamalimba.png' },
        { name: 'Stephen Shaw', image: 'stephenshaw.png' },
        { name: 'XuXue Feng', image: 'xuxuefeng.png' },
      ],
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
