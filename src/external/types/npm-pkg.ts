export interface NpmPKGInfo {
  name: string
  description: string
  keywords: string[]
  version: string
  homepage: string
  bugs: Bugs
  license: string
  main: string
  exports: any
  repository?: Repository
  engines?: Engines
  dependencies?: Record<string, string>

  gitHead: string
}
interface Bugs {
  url: string
}

interface Repository {
  type: string
  url: string
  directory: string
}
interface Engines {
  node: string
}
