import CheckCircleOutlined from '@vicons/antd/CheckCircleOutlined'
import QuestionCircleOutlined from '@vicons/antd/es/QuestionCircleOutlined'
import Lock from '@vicons/antd/LockFilled'
import Snippet from '@vicons/antd/SnippetsFilled'
import Book from '@vicons/fa/es/Book'
import Bookmark from '@vicons/fa/es/Bookmark'
import ChartLine from '@vicons/fa/es/ChartLine'
import Code from '@vicons/fa/es/Code'
import Cogs from '@vicons/fa/es/Cogs'
import Comment from '@vicons/fa/es/Comment'
import Comments from '@vicons/fa/es/Comments'
import EllipsisH from '@vicons/fa/es/EllipsisH'
import Eye from '@vicons/fa/es/Eye'
import File from '@vicons/fa/es/File'
import Flask from '@vicons/fa/es/Flask'
import Heart from '@vicons/fa/es/Heart'
import Markdown from '@vicons/fa/es/Markdown'
import Moon from '@vicons/fa/es/Moon'
import PencilAlt from '@vicons/fa/es/PencilAlt'
import PuzzlePiece from '@vicons/fa/es/PuzzlePiece'
import SlidersH from '@vicons/fa/es/SlidersH'
import Sun from '@vicons/fa/es/Sun'
import TachometerAlt from '@vicons/fa/es/TachometerAlt'
import TelegramPlane from '@vicons/fa/es/TelegramPlane'
import ThumbsUp from '@vicons/fa/es/ThumbsUp'
import UndoAlt from '@vicons/fa/es/UndoAlt'
import UserFriends from '@vicons/fa/es/UserFriends'
import Pen from '@vicons/fa/Pen'
import SlackHash from '@vicons/fa/SlackHash'
import Add12Filled from '@vicons/fluent/es/Add12Filled'
import Delete16Regular from '@vicons/fluent/es/Delete16Regular'
import EmojiAdd24Regular from '@vicons/fluent/es/EmojiAdd24Regular'
import EyeHide20Filled from '@vicons/fluent/es/EyeOff20Filled'
import Games24Regular from '@vicons/fluent/es/Games24Regular'
import Guest16Filled from '@vicons/fluent/es/Guest16Filled'
import Link24Filled from '@vicons/fluent/es/Link24Filled'
import Location24Regular from '@vicons/fluent/es/Location24Regular'
import Note24Filled from '@vicons/fluent/es/Note24Filled'
import Search24Regular from '@vicons/fluent/es/Search24Regular'
import ChatbubblesSharp from '@vicons/ionicons5/es/ChatbubblesSharp'
import CheckmarkSharp from '@vicons/ionicons5/es/CheckmarkSharp'
import CloseSharp from '@vicons/ionicons5/es/CloseSharp'
import Extension24Filled from '@vicons/ionicons5/es/ExtensionPuzzle'
import Hamburger from '@vicons/ionicons5/es/Menu'
import RefreshCircle from '@vicons/ionicons5/es/RefreshCircle'
import RefreshOutline from '@vicons/ionicons5/es/RefreshOutline'
import Trash from '@vicons/ionicons5/es/Trash'
import TrashSharp from '@vicons/ionicons5/es/TrashSharp'
import AddLinkFilled from '@vicons/material/es/AddLinkFilled'
import BubbleChartFilled from '@vicons/material/es/BubbleChartFilled'
import FullscreenExitOutlined from '@vicons/material/es/FullscreenExitOutlined'
import OnlinePredictionFilled from '@vicons/material/es/OnlinePredictionFilled'
import RedoRound from '@vicons/material/es/RedoRound'
import UndoRound from '@vicons/material/es/UndoRound'
import Activity from '@vicons/tabler/es/Activity'
import Clock from '@vicons/tabler/es/Clock'
import Copy from '@vicons/tabler/es/Copy'
import ExternalLink from '@vicons/tabler/es/ExternalLink'
import Template from '@vicons/tabler/es/Layout2'
import Log from '@vicons/tabler/es/News'
import Pencil from '@vicons/tabler/es/Pencil'
import Refresh from '@vicons/tabler/es/Refresh'
import Settings from '@vicons/tabler/es/Settings'
export { Lock as LockIcon }
export { Pen as PenIcon }
export {
  TrashSharp as TrashSharpIcon,
  RedoRound as RedoRoundIcon,
  UndoRound as UndoRoundIcon,
}
export { CheckCircleOutlined as CheckCircleOutlinedIcon }
export { ThumbsUp as ThumbsUpIcon }
export { SlidersH as SlidersHIcon, TelegramPlane as TelegramPlaneIcon }
export {
  Extension24Filled as ExtensionIcon,
  Games24Regular as GamesIcon,
  Guest16Filled as GuestIcon,
  Link24Filled as LinkIcon,
  Note24Filled as NoteIcon,
  ChatbubblesSharp as ChatbubblesSharpIcon,
  AddLinkFilled as AddLinkFilledIcon,
  BubbleChartFilled as BubbleChartFilledIcon,
  OnlinePredictionFilled as OnlinePredictionFilledIcon,
  Activity as ActivityIcon,
  Copy as CopyIcon,
  Refresh as RefreshIcon,
}
export { CloseSharp as CloseSharpIcon }
export { CheckmarkSharp as CheckmarkSharpIcon }
export { EmojiAdd24Regular as EmojiAddIcon }
export { RefreshOutline as RefreshOutlineIcon, Trash as TrashIcon }
export {
  Snippet as SnippetIcon,
  ChartLine as ChartLineIcon,
  Code as CodeIcon,
  Cogs as CogsIcon,
  Comment as CommentIcon,
  Comments as CommentsIcon,
  EllipsisH as EllipsisHIcon,
  Eye as EyeIcon,
  File as FileIcon,
  Flask as FlaskIcon,
  Markdown as MarkdownIcon,
  PencilAlt as PencilAltIcon,
  PuzzlePiece as PuzzlePieceIcon,
  TachometerAlt as TachometerAltIcon,
  UndoAlt as UndoAltIcon,
  UserFriends as UserFriendsIcon,
  Clock as ClockIcon,
  Template as TemplateIcon,
  Log as LogIcon,
  Pencil as PencilIcon,
}
export { Moon as MoonIcon, Sun as SunIcon }
export { QuestionCircleOutlined as QuestionCircleIcon }
export { SlackHash as SlackHashIcon }
export { Hamburger as HamburgerIcon }
export { Search24Regular as SearchIcon }
export { Location24Regular as LocationIcon }
export { ExternalLink as ExternalLinkIcon }
export { Settings as SettingsIcon }
export { FullscreenExitOutlined }
export { Book as BookIcon }
export { Bookmark as BookmarkIcon }
export { Heart as HeartIcon }
export { EyeHide20Filled as EyeHideIcon }
export { RefreshCircle }

export const MagnifyIcon = defineComponent({
  setup() {
    return () => (
      <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path
          d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5l-1.5 1.5l-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16A6.5 6.5 0 0 1 3 9.5A6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14S14 12 14 9.5S12 5 9.5 5z"
          fill="currentColor"
        ></path>
      </svg>
    )
  },
})

export const AddIcon = defineComponent({
  setup() {
    return () => <Add12Filled />
  },
})

export const DeleteIcon = defineComponent({
  setup() {
    return () => <Delete16Regular />
  },
})

export const SendIcon = defineComponent({
  setup() {
    return () => <TelegramPlane />
  },
})

export const GithubIcon = defineComponent({
  setup() {
    return () => (
      <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path
          d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
          fill="#fff"
        ></path>
      </svg>
    )
  },
})

export const MenuDownIcon = defineComponent({
  setup() {
    return () => (
      <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path d="M7 10l5 5l5-5H7z" fill="currentColor"></path>
      </svg>
    )
  },
})

export const CheckIcon = defineComponent({
  setup() {
    return () => (
      <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path
          d="M21 5L9 17l-5.5-5.5l1.41-1.41L9 14.17L19.59 3.59L21 5M3 21v-2h18v2H3z"
          fill="currentColor"
        ></path>
      </svg>
    )
  },
})

export const PlusIcon = AddIcon
