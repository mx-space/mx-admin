import { CommentState } from '~/models/comment'

export const commentsQueryKey = ['comments']
export const commentsPageSize = 20

export const commentQuickEmojis = [
  '😀',
  '😄',
  '😂',
  '😊',
  '😍',
  '🥳',
  '😢',
  '😭',
  '😅',
  '🤔',
  '👍',
  '👎',
  '👏',
  '🙏',
  '💪',
  '🔥',
  '✨',
  '❤️',
  '💔',
  '🎉',
  '🌹',
  '🍻',
  '☕',
  '🚀',
]

export const commentFilters: { label: string; value: CommentState }[] = [
  { label: '待审核', value: CommentState.Unread },
  { label: '已读', value: CommentState.Read },
  { label: '垃圾桶', value: CommentState.Junk },
]
