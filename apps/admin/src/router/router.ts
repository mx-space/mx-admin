import { createRouter, createWebHashHistory } from 'vue-router'

import { routes } from './route'

export const router = createRouter({
  history: createWebHashHistory(),

  routes,
})
