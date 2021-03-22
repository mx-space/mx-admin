/*
 * @Author: Innei
 * @Date: 2021-03-21 22:21:31
 * @LastEditTime: 2021-03-22 11:50:11
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/router.ts
 * Mark: Coding with Love
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import RootView from './App.vue'
import { DashBoardView } from './views/dashboard'
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: RootView,
      children: [
        {
          path: '/',
          component: DashBoardView,
        },
      ],
    },
  ],
})
