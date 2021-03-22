/*
 * @Author: Innei
 * @Date: 2021-03-21 22:21:31
 * @LastEditTime: 2021-03-22 11:50:11
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/router.ts
 * Mark: Coding with Love
 */

import { defineAsyncComponent } from '@vue/runtime-core'
import { createRouter, createWebHashHistory } from 'vue-router'
import RootView from './App.vue'
import { DashBoardView } from './views/dashboard'

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
          meta: { title: '仪表盘', icon: '' },
        },
        {
          path: 'posts',
          name: 'post',
          meta: { title: '博文', icon: ['fas', 'code'] },
          redirect: '/posts/view',
          component: defineAsyncComponent(() => import('./views/emptyview')),
          children: [
            {
              path: 'view',
              name: 'view-posts',
              meta: {
                title: '管理文章',
                icon: ['fas', 'eye'],
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
                icon: ['fas', 'pencil-alt'],
              },
              props: true,
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'category',
              name: 'edit-category',
              meta: { title: '分类/标签', icon: ['fas', 'puzzle-piece'] },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
          ],
        },
        {
          path: 'notes',
          name: 'note',
          meta: { title: '记录', icon: ['fas', 'book'] },
          redirect: '/notes/view',
          component: defineAsyncComponent(() => import('./views/emptyview')),
          children: [
            {
              path: 'view',
              name: 'view-notes',
              meta: { title: '管理', icon: ['fas', 'eye'], query: { page: 1 } },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'edit',
              name: 'edit-notes',
              meta: { title: '树洞', icon: ['fas', 'pencil-alt'] },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
          ],
        },
        {
          path: 'comments',
          name: 'comment',
          meta: { title: '评论', icon: ['fas', 'comment'] },
          component: defineAsyncComponent(() => import('./views/emptyview')),
        },
        {
          path: 'extra',
          name: 'extra',
          redirect: '/extra/project',
          meta: { title: '其他', icon: ['fas', 'angle-double-right'] },
          component: defineAsyncComponent(() => import('./views/emptyview')),
          children: [
            {
              path: 'project',
              name: 'project',
              meta: { title: '项目', icon: ['fas', 'flask'] },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
              children: [
                {
                  path: 'list',
                  name: 'project-list',
                  meta: { title: '项目列表', icon: ['fas', 'eye'] },
                  component: defineAsyncComponent(
                    () => import('./views/emptyview'),
                  ),
                },
                {
                  path: 'edit',
                  name: 'project-edit',
                  meta: { title: '创建项目', icon: ['fas', 'pencil-alt'] },
                  component: defineAsyncComponent(
                    () => import('./views/emptyview'),
                  ),
                },
              ],
            },
            {
              path: 'say',
              name: 'say',
              meta: { title: '说说', icon: ['far', 'comments'] },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
              children: [
                {
                  path: 'list',
                  name: 'say-list',
                  meta: { title: '说什么了', icon: ['fas', 'eye'] },
                  component: defineAsyncComponent(
                    () => import('./views/emptyview'),
                  ),
                },
                {
                  path: 'edit',
                  name: 'say-edit',
                  meta: { title: '我可没说过', icon: ['fas', 'pencil-alt'] },
                  component: defineAsyncComponent(
                    () => import('./views/emptyview'),
                  ),
                },
              ],
            },
            {
              path: 'page',
              name: 'page',
              meta: { title: '页面', icon: ['far', 'file'] },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
              children: [
                {
                  path: 'list',
                  name: 'page-list',
                  meta: {
                    title: '独立页面',
                    icon: ['fas', 'eye'],
                    query: { page: 1 },
                  },
                  component: defineAsyncComponent(
                    () => import('./views/emptyview'),
                  ),
                },
                {
                  path: 'edit',
                  name: 'page-edit',
                  meta: { title: '创建页面', icon: ['fas', 'pencil-alt'] },
                  component: defineAsyncComponent(
                    () => import('./views/emptyview'),
                  ),
                },
              ],
            },
            {
              name: 'friends',
              path: 'friends',
              meta: { title: '朋友们', icon: ['fas', 'user-friends'] },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              name: 'files',
              path: 'files',
              meta: { title: '管理文件', icon: ['far', 'file-alt'] },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
          ],
        },
        {
          path: 'analyze',
          component: defineAsyncComponent(() => import('./views/emptyview')),
          meta: { title: '数据', icon: ['fas', 'chart-line'] },
          name: 'analyze',
        },
        {
          path: 'setting',
          name: 'setting',
          meta: { title: '设定', icon: ['fas', 'cogs'] },
          redirect: '/setting/profile',
          component: defineAsyncComponent(() => import('./views/emptyview')),
          children: [
            {
              path: 'profile',
              name: 'setting-profile',
              meta: { title: '主人设定', icon: ['fas', 'user-alt'] },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'system',
              name: 'setting-system',
              meta: { title: '系统设定', icon: ['fas', 'cog'] },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'security',
              name: 'setting-security',
              meta: { title: '安全', icon: ['fas', 'lock-open'] },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'reset',
              name: 'reset',
              meta: { title: '重置', icon: ['fas', 'redo-alt'] },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
          ],
        },
        {
          path: 'other',
          name: 'other',
          meta: { title: '其他', icon: ['fas', 'ellipsis-h'] },
          component: defineAsyncComponent(() => import('./views/emptyview')),
          children: [
            {
              path: 'backup',
              name: 'backup',
              meta: { title: '备份', icon: ['fas', 'undo-alt'] },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'markdown',
              name: 'markdown',
              meta: { title: 'Markdown 导入导出', icon: ['fab', 'markdown'] },
              component: defineAsyncComponent(
                () => import('./views/emptyview'),
              ),
            },
            {
              path: 'optimize',
              name: 'optimize',
              meta: { title: '优化', icon: ['fas', 'wrench'] },
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
