import { request } from '~/utils/request'

export interface StatCount {
  posts: number
  notes: number
  pages: number
  categories: number
  tags: number
  comments: number
  links: number
  says: number
  recently: number
  unreadComments: number
  online: number
  todayMaxOnline: number
  todayOnlineTotal: number
  callTime: number
  uv: number
  todayIpAccessCount: number
}

export interface CategoryDistribution {
  id: string
  name: string
  slug: string
  count: number
}

export interface PublicationTrend {
  date: string
  posts: number
  notes: number
}

export interface TagCloudItem {
  tag: string
  count: number
}

export interface TopArticle {
  id: string
  title: string
  slug: string
  reads: number
  likes: number
  category: {
    name: string
    slug: string
  } | null
}

export interface CommentActivityItem {
  date: string
  count: number
}

export interface TrafficSourceData {
  os: Array<{ name: string; count: number }>
  browser: Array<{ name: string; count: number }>
}

export interface WordCount {
  count: number
}

export interface ReadAndLikeCount {
  totalLikes: number
  totalReads: number
}

export const aggregateApi = {
  // 获取统计数据
  getStat: () => request.get<StatCount>('/aggregate/stat'),

  // 获取分类分布
  getCategoryDistribution: () =>
    request.get<CategoryDistribution[]>(
      '/aggregate/stat/category-distribution',
    ),

  // 获取发布趋势
  getPublicationTrend: () =>
    request.get<PublicationTrend[]>('/aggregate/stat/publication-trend'),

  // 获取标签云
  getTagCloud: () => request.get<TagCloudItem[]>('/aggregate/stat/tag-cloud'),

  // 获取热门文章
  getTopArticles: () =>
    request.get<TopArticle[]>('/aggregate/stat/top-articles'),

  // 获取评论活动
  getCommentActivity: () =>
    request.get<CommentActivityItem[]>('/aggregate/stat/comment-activity'),

  // 获取流量来源
  getTrafficSource: () =>
    request.get<TrafficSourceData>('/aggregate/stat/traffic-source'),

  // 获取站点字数统计
  countSiteWords: () => request.get<WordCount>('/aggregate/count_site_words'),

  // 获取阅读和点赞统计
  countReadAndLike: () =>
    request.get<ReadAndLikeCount>('/aggregate/count_read_and_like'),

  // 获取站点点赞数
  getSiteLikeCount: () => request.get<number>('/like_this'),

  // 清理缓存
  cleanCache: () => request.get<void>('/clean_catch'),

  // 清理 Redis
  cleanRedis: () => request.get<void>('/clean_redis'),
}
