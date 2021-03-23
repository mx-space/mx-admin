/*
 * @Author: Innei
 * @Date: 2021-03-21 22:21:31
 * @LastEditTime: 2021-03-22 11:50:11
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/router.ts
 * Mark: Coding with Love
 */
// @ts-nocheck
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import {
  faBook,
  faChartLine,
  faCode,
  faCogs,
  faComment,
  faComments,
  faEllipsisH,
  faEye,
  faFile,
  faFileAlt,
  faFlask,
  faLockOpen,
  faPencilAlt,
  faPuzzlePiece,
  faRedoAlt,
  faUndoAlt,
  faUserAlt,
  faUserFriends,
  faWrench,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import dashboardFilled from '@iconify-icons/ant-design/dashboard-filled'
import { InlineIcon as Icon } from '@iconify/vue'
import { defineAsyncComponent } from '@vue/runtime-core'
import {
  createRouter,
  createWebHashHistory,
  RouteRecordNormalized,
} from 'vue-router'
import { SidebarLayout } from '../layouts/sidebar'
import { DashBoardView } from '../views/dashboard'
import LoginView from '../views/login/index.vue'

export const routeForMenu: Array<RouteRecordNormalized> = [
  {
    path: '/dashboard',
    component: DashBoardView,
    name: 'dashboard',
    meta: { title: '仪表盘', icon: <Icon icon={dashboardFilled} /> },
  },
  {
    path: '/posts',
    name: 'post',
    meta: { title: '博文', icon: <FontAwesomeIcon icon={faCode} /> },
    redirect: '/posts/view',
    component: defineAsyncComponent(() => import('../views/emptyview')),
    children: [
      {
        path: 'view',
        name: 'view-posts',
        meta: {
          title: '管理文章',
          icon: <FontAwesomeIcon icon={faEye} />,
          query: { page: 1 },
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
      {
        path: 'edit',
        name: 'edit-posts',
        meta: {
          title: '撰写文章',
          icon: <FontAwesomeIcon icon={faPencilAlt} />,
        },
        props: true,
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
      {
        path: 'category',
        name: 'edit-category',
        meta: {
          title: '分类/标签',
          icon: <FontAwesomeIcon icon={faPuzzlePiece} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
    ],
  },
  {
    path: '/notes',
    name: 'note',
    meta: {
      title: '记录',
      icon: <FontAwesomeIcon icon={faBook} />,
    },
    redirect: '/notes/view',
    component: defineAsyncComponent(() => import('../views/emptyview')),
    children: [
      {
        path: 'view',
        name: 'view-notes',
        meta: {
          title: '管理',
          query: { page: 1 },
          icon: <FontAwesomeIcon icon={faEye} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
      {
        path: 'edit',
        name: 'edit-notes',
        meta: {
          title: '树洞',
          icon: <FontAwesomeIcon icon={faPencilAlt} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
    ],
  },
  {
    path: '/comments',
    name: 'comment',
    meta: { title: '评论', icon: <FontAwesomeIcon icon={faComment} /> },
    component: defineAsyncComponent(() => import('../views/emptyview')),
  },
  {
    path: '/page',
    name: 'page',
    meta: {
      title: '页面',
      icon: <FontAwesomeIcon icon={faFile} />,
    },
    component: defineAsyncComponent(() => import('../views/emptyview')),
    children: [
      {
        path: 'list',
        name: 'page-list',
        meta: {
          title: '独立页面',
          icon: <FontAwesomeIcon icon={faEye} />,
          query: { page: 1 },
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
      {
        path: 'edit',
        name: 'page-edit',
        meta: {
          title: '创建页面',
          icon: <FontAwesomeIcon icon={faPencilAlt} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
    ],
  },
  {
    path: '/say',
    name: 'say',
    meta: { title: '说说', icon: <FontAwesomeIcon icon={faComments} /> },
    component: defineAsyncComponent(() => import('../views/emptyview')),
    children: [
      {
        path: 'list',
        name: 'say-list',
        meta: {
          title: '说什么了',
          icon: <FontAwesomeIcon icon={faEye} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
      {
        path: 'edit',
        name: 'say-edit',
        meta: {
          title: '说点什么呢',
          icon: <FontAwesomeIcon icon={faPencilAlt} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
    ],
  },
  {
    path: '/project',
    name: 'project',
    meta: { title: '项目', icon: <FontAwesomeIcon icon={faFlask} /> },
    component: defineAsyncComponent(() => import('../views/emptyview')),
    children: [
      {
        path: 'list',
        name: 'project-list',
        meta: {
          title: '项目列表',
          icon: <FontAwesomeIcon icon={faEye} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
      {
        path: 'edit',
        name: 'project-edit',
        meta: {
          title: '创建项目',
          icon: <FontAwesomeIcon icon={faPencilAlt} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
    ],
  },
  {
    path: '/friends',
    name: 'friends',
    meta: {
      title: '朋友们',
      icon: <FontAwesomeIcon icon={faUserFriends} />,
    },
    component: defineAsyncComponent(() => import('../views/emptyview')),
  },
  {
    path: '/files',
    name: 'files',
    meta: {
      title: '管理文件',
      icon: <FontAwesomeIcon icon={faFileAlt} />,
    },
    component: defineAsyncComponent(() => import('../views/emptyview')),
  },

  {
    path: '/analyze',
    component: defineAsyncComponent(() => import('../views/emptyview')),
    meta: { title: '数据', icon: <FontAwesomeIcon icon={faChartLine} /> },
    name: 'analyze',
  },
  {
    path: '/setting',
    name: 'setting',
    meta: { title: '设定', icon: <FontAwesomeIcon icon={faCogs} /> },
    redirect: '/setting/profile',
    component: defineAsyncComponent(() => import('../views/emptyview')),
    children: [
      {
        path: 'profile',
        name: 'setting-profile',
        meta: {
          title: '主人设定',
          icon: <FontAwesomeIcon icon={faUserAlt} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
      {
        path: 'system',
        name: 'setting-system',
        meta: {
          title: '系统设定',
          icon: <FontAwesomeIcon icon={faCogs} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
      {
        path: 'security',
        name: 'setting-security',
        meta: {
          title: '安全',
          icon: <FontAwesomeIcon icon={faLockOpen} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
      {
        path: 'reset',
        name: 'reset',
        meta: {
          title: '重置',
          icon: <FontAwesomeIcon icon={faRedoAlt} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
    ],
  },
  {
    path: '/other',
    name: 'other',
    meta: { title: '其他', icon: <FontAwesomeIcon icon={faEllipsisH} /> },
    component: defineAsyncComponent(() => import('../views/emptyview')),
    children: [
      {
        path: 'backup',
        name: 'backup',
        meta: {
          title: '备份',
          icon: <FontAwesomeIcon icon={faUndoAlt} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
      {
        path: 'markdown',
        name: 'markdown',
        meta: {
          title: 'Markdown 导入导出',

          icon: <FontAwesomeIcon icon={faMarkdown} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
      },
      {
        path: 'optimize',
        name: 'optimize',
        meta: {
          title: '优化',
          icon: <FontAwesomeIcon icon={faWrench} />,
        },
        component: defineAsyncComponent(() => import('../views/emptyview')),
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
      component: LoginView,
    },
  ],
})
