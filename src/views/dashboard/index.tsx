/*
 * @Author: Innei
 * @Date: 2021-03-22 11:49:25
 * @LastEditTime: 2021-03-22 11:51:19
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/views/dashboard/index.tsx
 * Mark: Coding with Love
 */

import { defineComponent } from '@vue/runtime-core'


const el = <span>11111</span>
export const DashBoardView = defineComponent({
  name: 'dashboard',
  setup() {
    return () => <p class="">Hello
      {el}
    </p>
  },
})


