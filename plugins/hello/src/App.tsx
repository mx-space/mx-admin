import { defineComponent } from 'vue'

export const register = () => {
  return {
    name: 'hello',

    component: defineComponent({
      setup() {
        return () => <div>Hello</div>
      },
    }),
  }
}
