// Bit flags inlined from @mx-space/api-client to drop the runtime dependency.
export const SubscribePostCreateBit = 1
export const SubscribeNoteCreateBit = 2
export const SubscribeSayCreateBit = 4
export const SubscribeRecentCreateBit = 8

const bit2TextMap = new Map([
  [SubscribePostCreateBit, '博文'],
  [SubscribeNoteCreateBit, '手记'],
  [SubscribeRecentCreateBit, '速记'],
  [SubscribeSayCreateBit, '说说'],
])

export { bit2TextMap as SubscribeBit2TextMap }
