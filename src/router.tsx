/*
 * @Author: Innei
 * @Date: 2021-03-21 22:21:31
 * @LastEditTime: 2021-03-22 11:50:11
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/router.ts
 * Mark: Coding with Love
 */

import dashboardFilled from '@iconify-icons/ant-design/dashboard-filled'

import { defineAsyncComponent } from '@vue/runtime-core'
import { createRouter, createWebHashHistory } from 'vue-router'
import RootView from './App.vue'
import { DashBoardView } from './views/dashboard'
import { InlineIcon as Icon } from '@iconify/vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: RootView,
      name: 'home',
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          component: DashBoardView,
          name: 'dashboard',
          meta: { title: '仪表盘', icon: <Icon icon={dashboardFilled} /> },
        },
        {
          path: 'posts',
          name: 'post',
          meta: { title: '博文' },
          redirect: '/posts/view',
          component: defineAsyncComponent(() => import('./views/emptyview')),
          children: [
            {
              path: 'view',
              name: 'view-posts',
              meta: {
                title: '管理文章',

                query: { page: 1 },
              },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'edit',
              name: 'edit-posts',
              meta: {
                title: '撰写文章',
              },
              props: true,
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'category',
              name: 'edit-category',
              meta: { title: '分类/标签' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
          ],
        },
        {
          path: 'notes',
          name: 'note',
          meta: { title: '记录' },
          redirect: '/notes/view',
          component: defineAsyncComponent(() => import('./views/emptyview')),
          children: [
            {
              path: 'view',
              name: 'view-notes',
              meta: { title: '管理', query: { page: 1 } },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'edit',
              name: 'edit-notes',
              meta: { title: '树洞' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
          ],
        },
        {
          path: 'comments',
          name: 'comment',
          meta: { title: '评论' },
          component: defineAsyncComponent(() => import('./views/emptyview')),
        },
        {
          path: 'page',
          name: 'page',
          meta: { title: '页面' },
          component: defineAsyncComponent(() => import('./views/emptyview')),
          children: [
            {
              path: 'list',
              name: 'page-list',
              meta: {
                title: '独立页面',

                query: { page: 1 },
              },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'edit',
              name: 'page-edit',
              meta: { title: '创建页面' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
          ],
        },
        {
          path: 'say',
          name: 'say',
          meta: { title: '说说' },
          component: defineAsyncComponent(() => import('./views/emptyview')),
          children: [
            {
              path: 'list',
              name: 'say-list',
              meta: { title: '说什么了' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'edit',
              name: 'say-edit',
              meta: { title: '我可没说过' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
          ],
        },
        {
          path: 'project',
          name: 'project',
          meta: { title: '项目' },
          component: defineAsyncComponent(() => import('./views/emptyview')),
          children: [
            {
              path: 'list',
              name: 'project-list',
              meta: { title: '项目列表' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'edit',
              name: 'project-edit',
              meta: { title: '创建项目' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
          ],
        },
        {
          name: 'friends',
          path: 'friends',
          meta: { title: '朋友们' },
          component: defineAsyncComponent(() => import('./views/emptyview')),
        },
        {
          name: 'files',
          path: 'files',
          meta: { title: '管理文件' },
          component: defineAsyncComponent(() => import('./views/emptyview')),
        },

        {
          path: 'analyze',
          component: defineAsyncComponent(() => import('./views/emptyview')),
          meta: { title: '数据' },
          name: 'analyze',
        },
        {
          path: 'setting',
          name: 'setting',
          meta: { title: '设定' },
          redirect: '/setting/profile',
          component: defineAsyncComponent(() => import('./views/emptyview')),
          children: [
            {
              path: 'profile',
              name: 'setting-profile',
              meta: { title: '主人设定' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'system',
              name: 'setting-system',
              meta: { title: '系统设定' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'security',
              name: 'setting-security',
              meta: { title: '安全' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'reset',
              name: 'reset',
              meta: { title: '重置' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
          ],
        },
        {
          path: 'other',
          name: 'other',
          meta: { title: '其他' },
          component: defineAsyncComponent(() => import('./views/emptyview')),
          children: [
            {
              path: 'backup',
              name: 'backup',
              meta: { title: '备份' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'markdown',
              name: 'markdown',
              meta: { title: 'Markdown 导入导出' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'optimize',
              name: 'optimize',
              meta: { title: '优化' },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
          ],
        },
      ],
    },
  ],
})

router.getRoutes()
