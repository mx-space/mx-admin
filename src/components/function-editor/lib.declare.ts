export namespace globalTypeDeclare {
  export const libSource = `
  declare interface Context {
    req: any
    res: any

    query: Record<string, string>
    headers: Record<string, string>
    params: Record<string, string>

    model: any
    document: any
    name: string
    reference: string

    writeAsset: (path: string, data: any, options: any) => void
    readAsset: (path: string, options: any) => void
  }

  declare interface Context {
    req: any
    res: any

    query: Record<string, string>
    headers: Record<string, string>
    params: Record<string, string>

    throws: (code: number, message: string) => void

    model: any
    document: any
    name: string
    reference: string

    writeAsset: (path: string, data: any, options: any) => void
    readAsset: (path: string, options: any) => void
  }

  declare const __dirname: string
  declare const __filename: ''

  declare const Buffer: () => any

  declare const console: Console

  declare const logger: Console

  declare const require: (id: string) => Promise<any>
  declare const process: {
    env: Record<string, string>
    nextTick: (func: Function) => any
  }
  declare const context: Context
  `.trim()

  export const libUri = 'ts:filename/global.d.ts'
}
