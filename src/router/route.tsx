/**
 * 路由在此定义
 * @author Innei <https://innei.ren>
 */
import {
  Book as BookIcon,
  ChartLine as ChartLineIcon,
  Clock as ClockIcon,
  Code as CodeIcon,
  Settings as CogsIcon,
  MessageSquare as CommentIcon,
  MessagesSquare as CommentsIcon,
  Bug as DebugIcon,
  MoreHorizontal as EllipsisHIcon,
  Eye as EyeIcon,
  File as FileIcon,
  Beaker as FlaskIcon,
  FunctionSquare as FunctionIcon,
  Newspaper as LogIcon,
  FileCode2 as MarkdownIcon,
  Hammer as MidHammer,
  Pencil as PencilAltIcon,
  Pencil as PencilIcon,
  Users as PhUsersThreeBold,
  Puzzle as PuzzlePieceIcon,
  BellOff as SubscribeIcon,
  Paperclip as SymbolIcon,
  Gauge as TachometerAltIcon,
  Layout as TemplateIcon,
  Database as TopicIcon,
  Undo2 as UndoAltIcon,
  Users as UserFriendsIcon,
  Webhook as WebhookIcon,
} from 'lucide-vue-next'
import type { RouteRecordRaw } from 'vue-router'

import { AppLayout } from '~/layouts/app-layout'
import $RouterView from '~/layouts/router-view'
import { DashBoardView } from '~/views/dashboard'
import { ManagePostListView } from '~/views/manage-posts/list'

import SetupLayout from '../layouts/setup-view.vue'
import CommentPage from '../views/comments/index'
import LoginView from '../views/login'
import { ManageNoteListView } from '../views/manage-notes/list'
import ManageNoteWrite from '../views/manage-notes/write'
import ManagePostsWrite from '../views/manage-posts/write'
import { RouteName } from './name'

const OpenAIIcon = () => (
  <svg
    role="img"
    height="1em"
    width="1em"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
  </svg>
)

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
        component: ManagePostListView,
      },

      {
        path: 'edit',
        name: RouteName.EditPost,
        meta: {
          title: '撰写',
          icon: <PencilAltIcon />,
        },
        props: true,
        component: ManagePostsWrite,
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
      title: '手记',
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
        component: ManageNoteListView,
      },
      {
        path: 'edit',
        name: RouteName.EditNote,
        meta: {
          title: '撰写',
          icon: <PencilAltIcon />,
        },
        component: ManageNoteWrite,
      },

      {
        path: 'topic',
        name: RouteName.Topic,
        meta: {
          title: '专栏',
          icon: <TopicIcon />,
        },
        component: () => import('../views/manage-notes/topic'),
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
    component: CommentPage,
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
    path: '/readers',
    name: RouteName.Reader,
    meta: {
      title: '读者',
      icon: <PhUsersThreeBold />,
    },
    component: () => import('../views/reader'),
  },
  {
    path: '/files',
    name: RouteName.File,
    meta: {
      title: '文件',
      icon: <SymbolIcon />,
    },
    component: () => import('../views/manage-files'),
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
    path: '/ai',

    name: RouteName.Ai,
    meta: {
      title: 'AI',
      icon: <OpenAIIcon />,
    },

    redirect: '/ai/summary',
    children: [
      {
        path: 'summary',
        name: RouteName.AiSummary,
        meta: {
          title: '摘要',
          icon: <OpenAIIcon />,
        },
        component: () => import('../views/ai/summary'),
      },
    ],
  },
  {
    path: '/analyze',
    name: RouteName.Analyze,
    component: () => import('../views/analyze'),
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
    children: [],
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
    path: '/extra-features',
    name: RouteName.Other,
    meta: { title: '附加功能', icon: <EllipsisHIcon /> },
    component: $RouterView,
    children: [
      {
        path: 'snippets',
        name: RouteName.Snippet,
        meta: {
          title: '配置与云函数',
          icon: <FunctionIcon />,
        },
        component: () => import('../views/extra-features/snippets'),
      },

      {
        path: 'subscribe',
        name: RouteName.Subscribe,
        meta: {
          title: '订阅',
          icon: <SubscribeIcon />,
        },
        component: () => import('../views/extra-features/subscribe'),
      },
      {
        path: 'webhooks',
        name: RouteName.Webhook,
        meta: {
          title: 'Webhooks',
          icon: <WebhookIcon />,
        },
        component: () => import('../views/extra-features/webhook'),
      },

      {
        path: 'assets/template',
        name: RouteName.AssetTemplate,
        meta: {
          title: '模板编辑',
          icon: <TemplateIcon />,
        },
        component: () => import('../views/extra-features/assets/template'),
      },
      {
        path: 'markdown',
        name: RouteName.Markdown,
        meta: {
          title: 'Markdown 导入导出',

          icon: <MarkdownIcon />,
        },
        component: () => import('../views/extra-features/markdown-helper'),
      },
    ],
  },
  {
    name: RouteName.Maintain,
    path: '/maintenance',
    component: $RouterView,
    redirect: '/maintain/log',
    meta: {
      title: '维护',
      icon: <MidHammer />,
    },
    children: [
      {
        path: 'cron',
        name: RouteName.Cron,
        meta: {
          title: '任务',
          icon: <ClockIcon />,
        },
        component: () => import('../views/maintenance/cron'),
      },
      {
        path: 'backup',
        name: RouteName.Backup,
        meta: {
          title: '备份',
          icon: <UndoAltIcon />,
        },
        component: () => import('../views/maintenance/backup'),
      },

      {
        path: 'log',
        name: RouteName.Log,
        meta: {
          title: '日志',
          icon: <LogIcon />,
        },
        component: () => import('../views/maintenance/log-view'),
      },
    ],
  },
]

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
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
        meta: { isPublic: true, title: '登录' },
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
            path:
              path
                .split('/')
                .at(-1)
                ?.replace(/\.[jt]sx$/, '') || '',
            component: comp,
          }),
        )
      : [],
  },
  {
    path: '/debug',
    component: AppLayout,
    meta: {
      title: '调试',
      icon: <DebugIcon />,
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
            icon: <DebugIcon />,
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
