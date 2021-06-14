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
import { Icon as VIcon } from '@vicons/utils'
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
  PencilAlt,
  PuzzlePiece,
  RedoAlt,
  UndoAlt,
  UserAlt,
  UserFriends,
  Wrench,
  Markdown,
} from '@vicons/fa'
import {
  createRouter,
  createWebHashHistory,
  RouteRecordNormalized,
  RouteRecordRaw,
} from 'vue-router'
import $RouterView from '../layouts/router-view'
import { SidebarLayout } from '../layouts/sidebar'
import { DashBoardView } from '../views/dashboard'
import LoginView from '../views/login/index.vue'
import { ManagePostListView } from '../views/manage-posts/list'

export const routeForMenu: Array<RouteRecordRaw> = [
  {
    path: '/dashboard',
    component: DashBoardView,
    name: 'dashboard',
    meta: { title: '仪表盘', icon: <Icon icon={dashboardFilled} /> },
  },
  {
    path: '/posts',
    name: 'post',
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
        name: 'view-posts',
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
        path: 'edit/:id',
        name: 'edit-posts',
        meta: {
          hide: true,
        },
        props: true,
        component: () => import('../views/emptyview'),
      },
      {
        path: 'edit',
        name: 'new-posts',
        meta: {
          title: '撰写文章',
          icon: (
            <VIcon>
              <PencilAlt />
            </VIcon>
          ),
        },
        props: true,
        component: () => import('../views/emptyview'),
      },

      {
        path: 'category',
        name: 'edit-category',
        meta: {
          title: '分类/标签',
          icon: (
            <VIcon>
              <PuzzlePiece />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
    ],
  },
  {
    path: '/notes',
    name: 'note',
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
        component: () => import('../views/emptyview'),
      },
      {
        path: 'edit',
        name: 'edit-notes',
        meta: {
          title: '树洞',
          icon: (
            <VIcon>
              <PencilAlt />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
    ],
  },
  {
    path: '/comments',
    name: 'comment',
    meta: {
      title: '评论',
      icon: (
        <VIcon>
          <Comment />
        </VIcon>
      ),
    },
    component: () => import('../views/emptyview'),
  },
  {
    path: '/page',
    name: 'page',
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
        name: 'page-list',
        meta: {
          title: '独立页面',
          icon: (
            <VIcon>
              <Eye />
            </VIcon>
          ),
          query: { page: 1 },
        },
        component: () => import('../views/emptyview'),
      },
      {
        path: 'edit',
        name: 'page-edit',
        meta: {
          title: '创建页面',
          icon: (
            <VIcon>
              <PencilAlt />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
    ],
  },
  {
    path: '/say',
    name: 'say',
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
        name: 'say-list',
        meta: {
          title: '说什么了',
          icon: (
            <VIcon>
              <Eye />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
      {
        path: 'edit',
        name: 'say-edit',
        meta: {
          title: '说点什么呢',
          icon: (
            <VIcon>
              <PencilAlt />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
    ],
  },
  {
    path: '/project',
    name: 'project',
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
        name: 'project-list',
        meta: {
          title: '项目列表',
          icon: (
            <VIcon>
              <Eye />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
      {
        path: 'edit',
        name: 'project-edit',
        meta: {
          title: '创建项目',
          icon: (
            <VIcon>
              <PencilAlt />
            </VIcon>
          ),
        },
        component: () => import('../views/emptyview'),
      },
    ],
  },
  {
    path: '/friends',
    name: 'friends',
    meta: {
      title: '朋友们',
      icon: (
        <VIcon>
          <UserFriends />
        </VIcon>
      ),
    },
    component: () => import('../views/emptyview'),
  },
  {
    path: '/files',
    name: 'files',
    meta: {
      title: '管理文件',
      icon: (
        <VIcon>
          <FileAlt />
        </VIcon>
      ),
    },
    component: () => import('../views/emptyview'),
  },

  {
    path: '/analyze',
    component: () => import('../views/emptyview'),
    meta: {
      title: '数据',
      icon: (
        <VIcon>
          <ChartLine />
        </VIcon>
      ),
    },
    name: 'analyze',
  },
  {
    path: '/setting',
    name: 'setting',
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
        name: 'setting-profile',
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
        name: 'setting-system',
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
        name: 'setting-security',
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
        name: 'reset',
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
    name: 'other',
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
        name: 'backup',
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
        name: 'markdown',
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
        name: 'optimize',
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
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: SidebarLayout,
      name: 'home',
      redirect: '/dashboard',
      children: [...routeForMenu],
    },

    {
      path: '/login',
      name: 'login',
      meta: { isPublic: true, title: '登陆' },
      // @ts-expect-error fuck vue
      component: LoginView,
    },
  ],
})
