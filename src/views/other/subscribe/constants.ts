import {
  SubscribeNoteCreateBit,
  SubscribePostCreateBit,
  SubscribeRecentCreateBit,
  SubscribeSayCreateBit,
} from '@mx-space/api-client'

const bit2TextMap = new Map([
  [SubscribePostCreateBit, '博文'],
  [SubscribeNoteCreateBit, '点滴'],
  [SubscribeRecentCreateBit, '速记'],
  [SubscribeSayCreateBit, '说说'],
])

export { bit2TextMap as SubscribeBit2TextMap }
