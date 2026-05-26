import type { ReaderModel } from '~/api/readers'

export type ReaderWithKey = ReaderModel & { _key: string }
