# Icon Migration Plan: @vicons -> Lucide Icons

## Current Icon Libraries (to be removed)

- `@vicons/antd`
- `@vicons/fa`
- `@vicons/fluent`
- `@vicons/ionicons4`
- `@vicons/ionicons5`
- `@vicons/material`
- `@vicons/tabler`
- `@vicons/utils`

## Target Library

- `lucide-vue-next` - Official Lucide Icons for Vue 3

## Icon Mapping

### From @vicons/antd

| Current Icon | Export Name | Lucide Equivalent | Notes |
|---|---|---|---|
| CheckCircleOutlined | CheckCircleOutlinedIcon | `CircleCheck` | |
| QuestionCircleOutlined | QuestionCircleIcon | `CircleHelp` | |
| LockFilled | LockIcon | `Lock` | |
| SnippetsFilled | SnippetIcon | `FileCode` | |
| DownloadOutlined | DownloadOutlined | `Download` | |

### From @vicons/fa

| Current Icon | Export Name | Lucide Equivalent | Notes |
|---|---|---|---|
| Book | BookIcon | `Book` | |
| Bookmark | BookmarkIcon | `Bookmark` | |
| ChartLine | ChartLineIcon | `ChartLine` | |
| Cogs | CogsIcon | `Settings` | |
| Comment | CommentIcon | `MessageSquare` | |
| Comments | CommentsIcon | `MessagesSquare` | |
| EllipsisH | EllipsisHIcon | `MoreHorizontal` | |
| Eye | EyeIcon | `Eye` | |
| EyeDropper | EyeOffIcon | `EyeOff` | Note: Original was wrong icon! |
| File | FileIcon | `File` | |
| Flask | FlaskIcon | `Flask` or `Beaker` | `Beaker` recommended |
| Heart | HeartIcon | `Heart` | |
| Markdown | MarkdownIcon | `FileCode2` | No direct equivalent |
| PencilAlt | PencilAltIcon | `Pencil` | |
| PuzzlePiece | PuzzlePieceIcon | `Puzzle` | |
| SlidersH | SlidersHIcon | `SlidersHorizontal` | |
| TachometerAlt | TachometerAltIcon | `Gauge` | |
| TelegramPlane | TelegramPlaneIcon | `Send` | |
| ThumbsUp | ThumbsUpIcon | `ThumbsUp` | |
| UndoAlt | UndoAltIcon | `Undo2` | |
| UserFriends | UserFriendsIcon | `Users` | |
| Pen | PenIcon | `Pen` | |
| SlackHash | SlackHashIcon | `Hash` | |
| Bold | - | `Bold` | Editor toolbar |
| Code | - | `Code` | Editor toolbar |
| FileCode | - | `FileCode` | Editor toolbar |
| Heading | - | `Heading` | Editor toolbar |
| Italic | - | `Italic` | Editor toolbar |
| Link | - | `Link` | Editor toolbar |
| ListOl | - | `ListOrdered` | Editor toolbar |
| ListUl | - | `List` | Editor toolbar |
| Minus | - | `Minus` | Editor toolbar |
| QuoteRight | - | `Quote` | Editor toolbar |
| RedoAlt | - | `Redo2` | Editor toolbar |
| Smile | - | `Smile` | Editor toolbar |
| Strikethrough | - | `Strikethrough` | Editor toolbar |
| Tasks | - | `ListTodo` | Editor toolbar |

### From @vicons/fluent

| Current Icon | Export Name | Lucide Equivalent | Notes |
|---|---|---|---|
| Add12Filled | AddIcon / PlusIcon | `Plus` | |
| Delete16Regular | DeleteIcon | `Trash2` | |
| EmojiAdd24Regular | EmojiAddIcon | `SmilePlus` | |
| EyeOff20Filled | EyeHideIcon | `EyeOff` | |
| Games24Regular | GamesIcon | `Gamepad2` | |
| Guest16Filled | GuestIcon | `UserRound` | |
| Link24Filled | LinkIcon | `Link` | |
| Location24Regular | LocationIcon | `MapPin` | |
| Note24Filled | NoteIcon | `StickyNote` | |
| Search24Regular | SearchIcon | `Search` | |

### From @vicons/ionicons5

| Current Icon | Export Name | Lucide Equivalent | Notes |
|---|---|---|---|
| ChatbubblesSharp | ChatbubblesSharpIcon | `MessageCircle` | |
| CheckmarkSharp | CheckmarkSharpIcon | `Check` | |
| CloseSharp | CloseSharpIcon | `X` | |
| ExtensionPuzzle | ExtensionIcon | `Puzzle` | |
| RefreshCircle | RefreshCircle | `RefreshCcw` | |
| RefreshOutline | RefreshOutlineIcon | `RefreshCw` | |
| Trash | TrashIcon | `Trash` | |
| TrashSharp | TrashSharpIcon | `Trash2` | |

### From @vicons/material

| Current Icon | Export Name | Lucide Equivalent | Notes |
|---|---|---|---|
| AddLinkFilled | AddLinkFilledIcon | `LinkPlus` | Custom: Link + Plus |
| BubbleChartFilled | BubbleChartFilledIcon | `ChartScatter` | |
| FullscreenExitOutlined | FullscreenExitOutlined | `Minimize2` | |
| OnlinePredictionFilled | OnlinePredictionFilledIcon | `Radio` | |
| RedoRound | RedoRoundIcon | `Redo` | |
| UndoRound | UndoRoundIcon | `Undo` | |
| UnsubscribeOutlined | SubscribeIcon | `BellOff` | |

### From @vicons/tabler

| Current Icon | Export Name | Lucide Equivalent | Notes |
|---|---|---|---|
| Activity | ActivityIcon | `Activity` | |
| Clock | ClockIcon | `Clock` | |
| Copy | CopyIcon | `Copy` | |
| ExternalLink | ExternalLinkIcon | `ExternalLink` | |
| Layout2 | TemplateIcon | `Layout` | |
| News | LogIcon | `Newspaper` | |
| Pencil | PencilIcon | `Pencil` | |
| Settings | SettingsIcon | `Settings` | |

## Custom SVG Icons (Keep as-is)

These icons are custom SVG components and should be kept:

| Icon Name | Decision | Notes |
|---|---|---|
| SidebarCloseIcon | Keep | `PanelLeftClose` available |
| SunIcon | Replace | `Sun` |
| MoonIcon | Replace | `Moon` |
| CodeIcon | Replace | `Code` |
| RefreshIcon | Replace | `RefreshCw` |
| MagnifyIcon | Replace | `Search` |
| GithubIcon | Keep | Brand icon |
| MenuDownIcon | Replace | `ChevronDown` |
| CheckIcon | Replace | `Check` |
| TerminalIcon | Replace | `Terminal` |
| StatusIcon | Keep | Custom |
| FunctionIcon | Replace | `FunctionSquare` |
| RedisIcon | Keep | Brand icon |
| ImportIcon | Replace | `Download` |
| TopicIcon | Replace | `FolderOpen` |
| DebugIcon | Replace | `Bug` |
| SymbolIcon | Replace | `Paperclip` |
| UploadIcon | Replace | `Upload` |
| ArchiveIcon | Replace | `Archive` |
| LogoutIcon | Replace | `LogOut` |
| PhPushPin | Replace | `Pin` |
| UpgradeIcon | Replace | `ArrowUpCircle` |
| UserAnonymouse | Keep | Custom |
| MaterialSymbolsThumbUpOutline | Replace | `ThumbsUp` |
| MaterialSymbolsThumbDownOutline | Replace | `ThumbsDown` |
| OpenAIIcon | Keep | Brand icon |
| MagnifyingGlass | Replace | `Search` |
| MidHammer | Replace | `Hammer` |
| PhAlignLeft | Replace | `AlignLeft` |
| NotebookMinimalistic | Replace | `BookOpen` |
| DatabaseBackupIcon | Replace | `DatabaseBackup` |
| PassKeyOutlineIcon | Replace | `KeyRound` |
| WebhookIcon | Replace | `Webhook` |
| MingcuteCopy2Line | Replace | `Copy` |
| PhUsersThreeBold | Replace | `Users` |
| MingcuteUserStarFill | Replace | `UserRoundCheck` |

## Icons Without Direct Lucide Equivalent

| Icon | Recommendation |
|---|---|
| TelegramPlane | Use `Send` |
| Markdown | Use `FileCode2` or custom SVG |
| Redis | Keep custom SVG |
| OpenAI | Keep custom SVG |
| Github | Keep custom SVG |
| StatusIcon | Keep custom SVG |
| UserAnonymouse | Keep custom SVG |

## Migration Steps

1. Install `lucide-vue-next`
2. Create new `src/components/icons/lucide.tsx` with all Lucide imports
3. Update `src/components/icons/index.tsx` to re-export from lucide
4. Update all import paths in components
5. Remove @vicons packages from dependencies
6. Test all pages

## Usage Pattern

```tsx
// Before (@vicons)
import { Icon } from '@vicons/utils'
import Eye from '@vicons/fa/es/Eye'
<Icon size={18}><Eye /></Icon>

// After (Lucide)
import { Eye } from 'lucide-vue-next'
<Eye :size="18" />
```
