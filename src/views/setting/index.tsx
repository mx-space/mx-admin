import { ContentLayout } from 'layouts/content'
import { defineComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()
    console.log(route.params)

    return () => <ContentLayout></ContentLayout>
  },
})
