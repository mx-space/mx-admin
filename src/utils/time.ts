import * as dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import * as customParseFormat from 'dayjs/plugin/customParseFormat'
import * as LocalizedFormat from 'dayjs/plugin/localizedFormat'
import * as relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(customParseFormat)
dayjs.extend(relativeTime)
dayjs.extend(LocalizedFormat)
dayjs.locale('zh-cn')

export enum DateFormat {
  'YYYY年M月D日',
  'YYYY年M月D日 HH:mm:ss',
  'HH:mm',
  'LLLL',
  'H:mm:ss A',
}

export const parseDate = (
  time: string | Date,
  format: keyof typeof DateFormat = 'YYYY年M月D日',
) => dayjs(time).format(format)

export const relativeTimeFromNow = (time: Date | string) =>
  dayjs(new Date(time)).fromNow()

export const getDayOfYear = (date = new Date()) => {
  const now = date
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const day = Math.floor(diff / oneDay)

  return day
}
export default { parseDate, relativeTimeFromNow }
