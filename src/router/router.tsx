/*
 * @Author: Innei
 * @Date: 2021-03-21 22:21:31
 * @LastEditTime: 2021-03-22 11:50:11
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/router.ts
 * Mark: Coding with Love
 */
import { Icon } from '@vicons/utils'
import TachometerAlt from '@vicons/fa/es/TachometerAlt'
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
  Markdown,
  PencilAlt,
  PuzzlePiece,
  UndoAlt,
  UserFriends,
  Wrench,
} from '@vicons/fa/es'
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
    meta: {
      title: '仪表盘',
      icon: (
        <Icon>
          <TachometerAlt />
        </Icon>
      ),
    },
  },
  {
    path: '/posts',
    name: RouteName.Post,
    meta: {
      title: '博文',
      icon: (
        <Icon>
          <Code />
        </Icon>
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
            <Icon>
              <Eye />
            </Icon>
          ),
          query: { page: 1 },
        },
        component: () =>
          import('../views/manage-posts/list').then(
            (m) => m.ManagePostListView,
          ),
      },

      {
        path: 'edit',
        name: RouteName.EditPost,
        meta: {
          title: '撰写文章',
          icon: (
            <Icon>
              <PencilAlt />
            </Icon>
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
            <Icon>
              <PuzzlePiece />
            </Icon>
          ),
        },
        component: () =>
          import('../views/manage-posts/category').then((m) => m.CategoryView),
      },
    ],
  },
  {
    path: '/notes',
    name: RouteName.Note,
    meta: {
      title: '记录',
      icon: (
        <Icon>
          <Book />
        </Icon>
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
            <Icon>
              <Eye />
            </Icon>
          ),
        },
        component: () =>
          import('../views/manage-notes/list').then(
            (m) => m.ManageNoteListView,
          ),
      },
      {
        path: 'edit',
        name: RouteName.EditNote,
        meta: {
          title: '树洞',
          icon: (
            <Icon>
              <PencilAlt />
            </Icon>
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
        <Icon>
          <Comment />
        </Icon>
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
        <Icon>
          <File />
        </Icon>
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
            <Icon>
              <Eye />
            </Icon>
          ),
          query: { page: 1 },
        },
        component: () =>
          import('../views/manage-pages/list').then(
            (m) => m.ManagePageListView,
          ),
      },
      {
        path: 'edit',
        name: RouteName.EditPage,
        meta: {
          title: '创建页面',
          icon: (
            <Icon>
              <PencilAlt />
            </Icon>
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
        <Icon>
          <Comments />
        </Icon>
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
            <Icon>
              <Eye />
            </Icon>
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
            <Icon>
              <PencilAlt />
            </Icon>
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
        <Icon>
          <Flask />
        </Icon>
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
            <Icon>
              <Eye />
            </Icon>
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
            <Icon>
              <PencilAlt />
            </Icon>
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
        <Icon>
          <UserFriends />
        </Icon>
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
        <Icon>
          <FileAlt />
        </Icon>
      ),
    },
    component: () => import('../views/manage-files'),
  },

  {
    path: '/analyze',
    name: RouteName.Analyze,
    component: () => import('../views/analzye'),
    meta: {
      title: '数据',
      icon: (
        <Icon>
          <ChartLine />
        </Icon>
      ),
      query: { page: 1 },
    },
  },
  {
    path: '/setting',
    redirect: '/setting/user',
    meta: {
      title: '设定',
      icon: (
        <Icon>
          <Cogs />
        </Icon>
      ),
      params: { type: 'user' },
    },
    component: () => null,
  },
  {
    path: '/setting/:type',
    name: RouteName.Setting,
    meta: {
      title: '设定',
      params: { type: 'user' },
      hide: true,
    },
    component: () => import('../views/setting'),
  },
  {
    path: '/other',
    name: RouteName.Other,
    meta: {
      title: '其他',
      icon: (
        <Icon>
          <EllipsisH />
        </Icon>
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
            <Icon>
              <UndoAlt />
            </Icon>
          ),
        },
        component: () => import('../views/other/backup'),
      },
      {
        path: 'markdown',
        name: RouteName.Markdown,
        meta: {
          title: 'Markdown 导入导出',

          icon: (
            <Icon>
              <Markdown />
            </Icon>
          ),
        },
        component: () => import('../views/other/markdown-helper'),
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
