/**
 * 路由在此定义
 * @author Innei <https://innei.ren>
 */
import {
  BookIcon,
  ChartLineIcon,
  ClockIcon,
  CodeIcon,
  CogsIcon,
  CommentIcon,
  CommentsIcon,
  EllipsisHIcon,
  EyeIcon,
  FileIcon,
  FlaskIcon,
  FunctionIcon,
  LogIcon,
  MarkdownIcon,
  PencilAltIcon,
  PencilIcon,
  PuzzlePieceIcon,
  TachometerAltIcon,
  TemplateIcon,
  TerminalIcon,
  UndoAltIcon,
  UserFriendsIcon,
} from 'components/icons'
import $RouterView from 'layouts/router-view'
import { SidebarLayout } from 'layouts/sidebar'
import { DashBoardView } from 'views/dashboard'
import { RouteRecordRaw } from 'vue-router'

import SetupLayout from '../layouts/setup-view.vue'
import LoginView from '../views/login/index.vue'
import { RouteName } from './name'

export const routeForMenu: Array<RouteRecordRaw> = [
  {
    path: '/dashboard',
    component: DashBoardView,
    name: RouteName.Dashboard,
    meta: {
      title: '仪表盘',
      icon: <TachometerAltIcon />,
    },
  },
  {
    path: '/posts',
    name: RouteName.Post,
    meta: {
      title: '博文',
      icon: <CodeIcon />,
    },
    redirect: '/posts/view',
    component: $RouterView,
    children: [
      {
        path: 'view',
        name: RouteName.ViewPost,
        meta: {
          title: '管理',
          icon: <EyeIcon />,
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
          title: '撰写',
          icon: <PencilAltIcon />,
        },
        props: true,
        component: () => import('../views/manage-posts/write'),
      },

      {
        path: 'category',
        name: RouteName.EditCategory,
        meta: {
          title: '分类 / 标签',
          icon: <PuzzlePieceIcon />,
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
      title: '生活记录',
      icon: <BookIcon />,
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
          icon: <EyeIcon />,
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
          title: '撰写',
          icon: <PencilAltIcon />,
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
      icon: <CommentIcon />,
    },
    component: () => import('../views/comments/index'),
  },
  {
    path: '/pages',
    name: RouteName.Page,
    redirect: '/pages/list',
    meta: {
      title: '页面',
      icon: <FileIcon />,
    },
    component: $RouterView,
    children: [
      {
        path: 'list',
        name: RouteName.ListPage,
        meta: {
          title: '管理',
          icon: <EyeIcon />,
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
          title: '编辑',
          icon: <PencilAltIcon />,
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
      icon: <CommentsIcon />,
    },
    component: $RouterView,
    children: [
      {
        path: 'list',
        name: RouteName.ListSay,
        meta: {
          title: '说什么了',
          query: { page: 1 },
          icon: <EyeIcon />,
        },
        component: () => import('../views/manage-says/list'),
      },
      {
        path: 'edit',
        name: RouteName.EditSay,
        meta: {
          title: '说点什么呢',
          icon: <PencilAltIcon />,
        },
        component: () => import('../views/manage-says/edit'),
      },
    ],
  },
  {
    path: '/recently',
    name: RouteName.ListShortHand,
    meta: {
      title: '速记',
      icon: <PencilIcon />,
    },
    component: () => import('../views/shorthand'),
  },
  {
    path: '/projects',
    name: RouteName.Project,
    meta: {
      title: '项目',
      icon: <FlaskIcon />,
    },
    component: $RouterView,
    children: [
      {
        path: 'list',
        name: RouteName.ListProject,
        meta: {
          title: '项目列表',
          query: { page: 1 },
          icon: <EyeIcon />,
        },
        component: () => import('../views/manage-project/list'),
      },
      {
        path: 'edit',
        name: RouteName.EditProject,
        meta: {
          title: '创建项目',
          icon: <PencilAltIcon />,
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
      icon: <UserFriendsIcon />,
      query: { state: '0' },
    },
    component: () => import('../views/manage-friends'),
  },

  {
    path: '/analyze',
    name: RouteName.Analyze,
    component: () => import('../views/analzye'),
    meta: {
      title: '数据',
      icon: <ChartLineIcon />,
      query: { page: 1 },
    },
  },
  {
    path: '/setting',
    redirect: '/setting/user',
    meta: {
      title: '设定',
      icon: <CogsIcon />,
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
      icon: <EllipsisHIcon />,
    },
    component: $RouterView,
    children: [
      {
        path: 'snippets',
        name: RouteName.Snippet,
        meta: {
          title: '配置与云函数',
          icon: <FunctionIcon />,
        },
        component: () => import('../views/snippets'),
      },
      {
        path: 'assets/template',
        name: RouteName.AssetTemplate,
        meta: {
          title: '模板编辑',
          icon: <TemplateIcon />,
        },
        component: () => import('../views/assets/template'),
      },
      {
        path: 'backup',
        name: RouteName.Backup,
        meta: {
          title: '备份',
          icon: <UndoAltIcon />,
        },
        component: () => import('../views/other/backup'),
      },
      {
        path: 'markdown',
        name: RouteName.Markdown,
        meta: {
          title: 'Markdown 导入导出',

          icon: <MarkdownIcon />,
        },
        component: () => import('../views/other/markdown-helper'),
      },
      {
        path: 'cron',
        name: RouteName.Cron,
        meta: {
          title: '任务',
          icon: <ClockIcon />,
        },
        component: () => import('../views/other/cron'),
      },
      {
        path: 'log',
        name: RouteName.Log,
        meta: {
          title: '日志',
          icon: <LogIcon />,
        },
        component: () => import('../views/other/log-view'),
      },
      {
        path: 'pty',
        name: RouteName.Pty,
        meta: {
          title: '终端',
          icon: <TerminalIcon />,
        },
        component: () => import('../views/other/pty'),
      },
    ],
  },
]

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: SidebarLayout,
    name: RouteName.Home,
    redirect: '/dashboard',
    children: [...routeForMenu],
  },

  {
    path: '/',
    component: SetupLayout,

    children: [
      {
        path: '/login',
        name: RouteName.Login,
        meta: { isPublic: true, title: '登陆' },
        component: LoginView,
      },

      {
        path: '/setup',
        name: RouteName.Setup,
        meta: { isPublic: true, title: '初始化' },
        component: () => import('../views/setup/index'),
      },

      {
        path: '/setup-api',
        meta: { isPublic: true, title: '设置接口地址' },
        component: () => import('../views/setup-api'),
      },
    ],
  },

  // for dev
  {
    path: '/dev',
    redirect: __DEV__ ? undefined : '/',
    component: $RouterView,
    children: __DEV__
      ? Object.entries(import.meta.glob('../views/dev/**/*.tsx')).map(
          ([path, comp]) => ({
            path: path
              .split('/')
              .slice(-1)[0]
              .replace(/\.[jt]sx$/, ''),
            component: comp,
          }),
        )
      : [],
  },
  {
    path: '/debug',
    component: SidebarLayout,
    meta: {
      title: '调试',
    },
    children: Object.entries(import.meta.glob('../views/debug/**/*.tsx')).map(
      ([path, comp]) => {
        const _title = path.match(/debug\/(.*?)\/index\.tsx$/)![1]
        const title = _title[0].toUpperCase() + _title.slice(1)

        return {
          path: _title,
          component: comp,

          title,
          meta: {
            title,
            hideKbar: true,
          },
        }
      },
    ),
  },
  // v1 compatibility
  {
    path: '/page/:path(.*)*',
    name: 'page$',
    redirect: (to) => {
      return to.fullPath.replace(/^\/page\//, '/pages/')
    },
  },
  {
    path: '/extra/:path(.*)*',
    name: 'extra',
    redirect: (to) => {
      return to.fullPath.replace(/^\/extra/, '')
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    meta: { isPublic: true },
    redirect: '/',
  },
]
