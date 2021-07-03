import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'
import { routes } from './route'

export const router = createRouter({
  history: __DEV__ ? createWebHistory() : createWebHashHistory(),
  routes,
})
