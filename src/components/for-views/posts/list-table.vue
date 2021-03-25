<template>
  <DataTable responsiveLayout="scroll" :value="data">
    <Column field="title" header="标题" :sortable="true">
      <template #body="slot">
        <router-link :to="'/posts/edit?id=' + slot.data._id">{{
          slot.data.title
        }}</router-link>
      </template>
    </Column>
    <Column field="category.name" header="分类"> </Column>
    <Column field="created" header="创建于" :sortable="true">
      <template #body="slot">
        <span>
          {{ rt(slot.data.created) }}
        </span>
      </template>
    </Column>
    <Column field="created" header="修改于" :sortable="true">
      <template #body="slot">
        <span>
          {{ ft(slot.data.modified) }}
        </span>
      </template>
    </Column>
  </DataTable>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/runtime-core'
import { PostModel } from '../../../models/post'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { parseDate, relativeTimeFromNow } from '../../../utils/time'
export default defineComponent({
  components: { DataTable, Column },
  props: {
    data: {
      type: Array as PropType<PostModel[]>,
      required: true,
    },
  },
  computed: {
    rt() {
      return relativeTimeFromNow
    },
    ft() {
      return parseDate
    },
  },
})
</script>
