import { defineComponent } from 'vue'

export const Component = defineComponent({
  setup() {
    return () => <div>Hello</div>
  },
})

export const register = () => {
  return {
    name: 'hello',

    component: Component,
  }
}
