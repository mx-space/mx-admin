import { useMutation, useQuery } from '@tanstack/vue-query'
import { aggregateApi } from '~/api/aggregate'
import { queryKeys } from './keys'

/**
 * 获取统计数据
 */
export const useStatQuery = () => {
  return useQuery({
    queryKey: queryKeys.aggregate.stat(),
    queryFn: aggregateApi.getStat,
  })
}

/**
 * 获取分类分布
 */
export const useCategoryDistributionQuery = () => {
  return useQuery({
    queryKey: queryKeys.aggregate.categoryDistribution(),
    queryFn: aggregateApi.getCategoryDistribution,
  })
}

/**
 * 获取发布趋势
 */
export const usePublicationTrendQuery = () => {
  return useQuery({
    queryKey: queryKeys.aggregate.publicationTrend(),
    queryFn: aggregateApi.getPublicationTrend,
  })
}

/**
 * 获取标签云
 */
export const useTagCloudQuery = () => {
  return useQuery({
    queryKey: queryKeys.aggregate.tagCloud(),
    queryFn: aggregateApi.getTagCloud,
  })
}

/**
 * 获取热门文章
 */
export const useTopArticlesQuery = () => {
  return useQuery({
    queryKey: queryKeys.aggregate.topArticles(),
    queryFn: aggregateApi.getTopArticles,
  })
}

/**
 * 获取评论活动
 */
export const useCommentActivityQuery = () => {
  return useQuery({
    queryKey: queryKeys.aggregate.commentActivity(),
    queryFn: aggregateApi.getCommentActivity,
  })
}

/**
 * 获取站点字数统计
 */
export const useSiteWordsQuery = () => {
  return useQuery({
    queryKey: queryKeys.aggregate.siteWords(),
    queryFn: aggregateApi.countSiteWords,
  })
}

/**
 * 获取阅读和点赞统计
 */
export const useReadAndLikeQuery = () => {
  return useQuery({
    queryKey: queryKeys.aggregate.readAndLike(),
    queryFn: aggregateApi.countReadAndLike,
  })
}

/**
 * 清理缓存
 */
export const useCleanCacheMutation = () => {
  return useMutation({
    mutationFn: aggregateApi.cleanCache,
    onSuccess: () => {
      window.message.success('缓存已清理')
    },
  })
}

/**
 * 清理 Redis
 */
export const useCleanRedisMutation = () => {
  return useMutation({
    mutationFn: aggregateApi.cleanRedis,
    onSuccess: () => {
      window.message.success('Redis 已清理')
    },
  })
}
