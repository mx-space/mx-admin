/*
 * @Author: Innei
 * @Date: 2021-03-22 11:41:32
 * @LastEditTime: 2021-03-22 11:41:32
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/stores/ui.ts
 * Mark: Coding with Love
 */

import { ref } from '@vue/reactivity'

export function UIStore() {
  const theme = ref('white')
  return {
    theme,
  }
}
