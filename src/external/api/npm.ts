import type { NpmPKGInfo } from 'external/types/npm-pkg'
import { extend } from 'umi-request'

export const getNpmPKGLatest = async (name: string) => {
  return extend({}).get<NpmPKGInfo>(`https://registry.npmjs.org/${name}/latest`)
}
