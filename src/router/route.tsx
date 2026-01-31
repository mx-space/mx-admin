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
  FileEdit as DraftIcon,
  MoreHorizontal as EllipsisHIcon,
  Eye as EyeIcon,
  File as FileIcon,
  FileText as FileTextIcon,
  Beaker as FlaskIcon,
  FunctionSquare as FunctionIcon,
  Image as ImageIcon,
  Languages as LanguagesIcon,
  ListTodo as ListTodoIcon,
  FileCode2 as MarkdownIcon,
  Hammer as MidHammer,
  Pencil as PencilAltIcon,
  Pencil as PencilIcon,
  Users as PhUsersThreeBold,
  Puzzle as PuzzlePieceIcon,
  Sparkles as SparklesIcon,
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

import SetupLayout from '../layouts/setup-view'
import CommentPage from '../views/comments/index'
import LoginView from '../views/login'
import { ManageNoteListView } from '../views/manage-notes/list'
import ManageNoteWrite from '../views/manage-notes/write'
import ManagePostsWrite from '../views/manage-posts/write'
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
    path: '/drafts',
    name: RouteName.Draft,
    meta: {
      title: '草稿箱',
      icon: <DraftIcon />,
    },
    component: () => import('../views/drafts'),
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
    redirect: '/files/list',
    meta: {
      title: '文件',
      icon: <SymbolIcon />,
    },
    component: $RouterView,
    children: [
      {
        path: 'list',
        name: 'file-list',
        meta: {
          title: '文件管理',
          icon: <EyeIcon />,
        },
        component: () => import('../views/manage-files'),
      },
      {
        path: 'orphans',
        name: 'file-orphans',
        meta: {
          title: '孤儿图片',
          icon: <ImageIcon />,
        },
        component: () => import('../views/manage-files/orphans'),
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
        component: () => import('../views/manage-project/index'),
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
      icon: <SparklesIcon />,
    },

    redirect: '/ai/summary',
    children: [
      {
        path: 'summary',
        name: RouteName.AiSummary,
        meta: {
          title: '摘要',
          icon: <FileTextIcon />,
        },
        component: () => import('../views/ai/summary'),
      },
      {
        path: 'translation',
        name: RouteName.AiTranslation,
        meta: {
          title: '翻译',
          icon: <LanguagesIcon />,
        },
        component: () => import('../views/ai/translation'),
      },
      {
        path: 'tasks',
        name: RouteName.AiTasks,
        meta: {
          title: '任务队列',
          icon: <ListTodoIcon />,
        },
        component: () => import('../views/ai/tasks'),
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
    name: RouteName.Setting,
    meta: {
      title: '设定',
      icon: <CogsIcon />,
      query: { group: 'user' },
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
    redirect: '/maintenance/cron',
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
