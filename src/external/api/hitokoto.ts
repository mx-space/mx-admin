export enum SentenceType {
  '动画' = 'a',
  '漫画' = 'b',
  '游戏' = 'c',
  '文学' = 'd',
  '原创' = 'e',
  '来自网络' = 'f',
  '其他' = 'g',
  '影视' = 'h',
  '诗词' = 'i',
  '网易云' = 'j',
  '哲学' = 'k',
  '抖机灵' = 'l',
}
export const fetchHitokoto = async (
  type: SentenceType[] | SentenceType = SentenceType.文学,
) => {
  const json = await fetch(
    `https://v1.hitokoto.cn/${
      Array.isArray(type)
        ? `?${type.map((t) => `c=${t}`).join('&')}`
        : `?c=${type}`
    }`,
  )
  const data = (await (json.json() as unknown)) as {
    id: number
    hitokoto: string
    type: string
    from: string
    from_who: string
    creator: string
    creator_uid: number
    reviewer: number
    uuid: string
    created_at: string
  }

  return data
}
