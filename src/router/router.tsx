/*
 * @Author: Innei
 * @Date: 2021-03-21 22:21:31
 * @LastEditTime: 2021-03-22 11:50:11
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/router.ts
 * Mark: Coding with Love
 */

import dashboardFilled from '@iconify-icons/ant-design/dashboard-filled'
import { InlineIcon as Icon } from '@iconify/vue'
import {
  Book,
  ChartLine,
  Code,
  Cogs,
  Comment,
  Comments,
  EllipsisH,
  Eye,
  File,
  FileAlt,
  Flask,
  LockOpen,
  Markdown,
  PencilAlt,
  PuzzlePiece,
  RedoAlt,
  UndoAlt,
  UserAlt,
  UserFriends,
  Wrench,
} from '@vicons/fa'
import { Icon as VIcon } from '@vicons/utils'
import { ManagePostListView } from 'views/manage-posts/list'
import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  RouteRecordRaw,
} from 'vue-router'
import $RouterView from '../layouts/router-view'
import { SidebarLayout } from '../layouts/sidebar'
import { DashBoardView } from '../views/dashboard'
import LoginView from '../views/login/index.vue'
import { RouteName } from './name'

export const routeForMenu: Array<RouteRecordRaw> = [
  {
    path: '/dashboard',
    component: DashBoardView,
    name: RouteName.Dashboard,
    meta: { title: '仪表盘', icon: <Icon icon={dashboardFilled} /> },
  },
  {
    path: '/posts',
    name: RouteName.Post,
    meta: {
      title: '博文',
      icon: (
        <VIcon>
          <Code />
        </VIcon>
      ),
    },
    redirect: '/posts/view',
    component: $RouterView,
    children: [
      {
        path: 'view',
        name: RouteName.ViewPost,
        meta: {
          title: '管理文章',
          icon: (
            <VIcon>
              <Eye />
            </VIcon>
          ),
          query: { page: 1 },
        },
        component: () =>
          import('../views/manage-posts/list').then(m => m.ManagePostListView),
      },

      {
        path: 'edit',
        name: RouteName.EditPost,
        meta: {
          title: '撰写文章',
          icon: (
            <VIcon>
              <PencilAlt />
            </VIcon>
          ),
        },
        props: true,
        component: () => import('../views/manage-posts/write'),
      },

      {
        path: 'category',
        name: RouteName.EditCategory,
        meta: {
          title: '分类/标签',
          icon: (
            <VIcon>
              <PuzzlePiece />
            </VIcon>
          ),
        },
        component: () =>
          import('../views/manage-posts/category').then(m => m.CategoryView),
      },
    ],
  },
  {
    path: '/notes',
    name: RouteName.Note,
    meta: {
      title: '记录',
      icon: (
        <VIcon>
          <Book />
        </VIcon>
      ),
    },
    redirect: '/notes/view',
    component: $RouterView,
    children: [
      {
        path: 'view',
        name: 'view-notes',
        meta: {
          title: '管理',
          query: { page: 1 },
          icon: (
            <VIcon>
              <Eye />
            </VIcon>
          ),
        },
        component: () =>
          import('../views/manage-notes/list').then(m => m.ManageNoteListView),
      },
      {
        path: 'edit',
        name: RouteName.EditNote,
        meta: {
          title: '树洞',
          icon: (
            <VIcon>
              <PencilAlt />
            </VIcon>
          ),
        },
        component: () => import('../views/manage-notes/write'),
      },
    ],
  },
  {
    path: '/comments',
    name: RouteName.Comment,
    meta: {
      title: '评论',
      query: { page: 1, state: 0 },
      icon: (
        <VIcon>
          <Comment />
        </VIcon>
      ),
    },
    component: () => import('../views/comments/index'),
  },
  {
    path: '/pages',
    name: RouteName.Page,
    meta: {
      title: '页面',
      icon: (
        <VIcon>
          <File />
        </VIcon>
      ),
    },
    component: $RouterView,
    children: [
      {
        path: 'list',
        name: RouteName.ListPage,
        meta: {
          title: '独立页面',
          icon: (
            <VIcon>
              <Eye />
            </VIcon>
          ),
          query: { page: 1 },
        },
        component: () =>
          import('../views/manage-pages/list').then(m => m.ManagePageListView),
      },
      {
        path: 'edit',
        name: RouteName.EditPage,
        meta: {
          title: '创建页面',
          icon: (
            <VIcon>
              <PencilAlt />
            </VIcon>
          ),
        },
        component: () => import('../views/manage-pages/write'),
      },
    ],
  },
  {
    path: '/says',
    name: RouteName.Say,
    meta: {
      title: '说说',
      icon: (
        <VIcon>
          <Comments />
        </VIcon>
      ),
    },
    component: $RouterView,
    children: [
      {
        path: 'list',
        name: RouteName.ListSay,
        meta: {
          title: '说什么了',
          query: { page: 1 },
          icon: (
            <VIcon>
              <Eye />
            </VIcon>
          ),
        },
        component: () => import('../views/manage-says/list'),
      },
      {
        path: 'edit',
        name: RouteName.EditSay,
        meta: {
          title: '说点什么呢',
          icon: (
            <VIcon>
              <PencilAlt />
            </VIcon>
          ),
        },
        component: () => import('../views/manage-says/edit'),
      },
    ],
  },
  {
    path: '/projects',
    name: RouteName.Project,
    meta: {
      title: '项目',
      icon: (
        <VIcon>
          <Flask />
        </VIcon>
      ),
    },
    component: $RouterView,
    children: [
      {
        path: 'list',
        name: RouteName.ListProject,
        meta: {
          title: '项目列表',
          query: { page: 1 },
          icon: (
            <VIcon>
              <Eye />
            </VIcon>
          ),
        },
        component: () => import('../views/manage-project/list'),
      },
      {
        path: 'edit',
        name: RouteName.EditProject,
        meta: {
          title: '创建项目',
          icon: (
            <VIcon>
              <PencilAlt />
            </VIcon>
          ),
        },
        component: () => import('../views/manage-project/edit'),
      },
    ],
  },
  {
    path: '/friends',
    name: RouteName.Friend,
    meta: {
      title: '朋友们',
      icon: (
        <VIcon>
          <UserFriends />
        </VIcon>
      ),
      query: { state: '0' },
    },
    component: () => import('../views/manage-friends'),
  },
  {
    path: '/files',
    name: RouteName.File,
    meta: {
      title: '管理文件',
      icon: (
        <VIcon>
          <FileAlt />
        </VIcon>
      ),
    },
    component: () => import('../views/manage-files'),
  },

  {
    path: '/analyze',
    name: RouteName.Analyze,
    component: () => import('../views/emptyview'),
    meta: {
      title: '数据',
      icon: (
        <VIcon>
          <ChartLine />
        </VIcon>
      ),
    },
  },
  {
    path: '/setting',
    name: RouteName.Setting,
    meta: {
      title: '设定',
      icon: (
        <VIcon>
          <Cogs />
        </VIcon>
      ),
    },
    redirect: '/setting/profile',
    component: $RouterView,
    children: [
      {
        path: 'profile',
        name: RouteName.Profile,
        meta: {
          title: '主人设定',
          icon: (
            <VIcon>
              <UserAlt />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
      {
        path: 'system',
        name: RouteName.System,
        meta: {
          title: '系统设定',
          icon: (
            <VIcon>
              <Cogs />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
      {
        path: 'security',
        name: RouteName.Security,
        meta: {
          title: '安全',
          icon: (
            <VIcon>
              <LockOpen />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
      {
        path: 'reset',
        name: RouteName.Reset,
        meta: {
          title: '重置',
          icon: (
            <VIcon>
              <RedoAlt />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
    ],
  },
  {
    path: '/other',
    name: RouteName.Other,
    meta: {
      title: '其他',
      icon: (
        <VIcon>
          <EllipsisH />
        </VIcon>
      ),
    },
    component: $RouterView,
    children: [
      {
        path: 'backup',
        name: RouteName.Backup,
        meta: {
          title: '备份',
          icon: (
            <VIcon>
              <UndoAlt />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
      {
        path: 'markdown',
        name: RouteName.Markdown,
        meta: {
          title: 'Markdown 导入导出',

          icon: (
            <VIcon>
              <Markdown />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
      {
        path: 'optimize',
        name: RouteName.Optimize,
        meta: {
          title: '优化',
          icon: (
            <VIcon>
              <Wrench />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
    ],
  },
]

export const router = createRouter({
  history: __DEV__ ? createWebHistory() : createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: SidebarLayout,
      name: RouteName.Home,
      redirect: '/dashboard',
      children: [...routeForMenu],
    },

    {
      path: '/login',
      name: RouteName.Login,
      meta: { isPublic: true, title: '登陆' },
      component: LoginView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: '404',
      meta: { isPublic: true },
      redirect: '/',
    },
  ],
})
