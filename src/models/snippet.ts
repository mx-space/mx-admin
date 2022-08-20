import { BaseModel } from './base'

export const defaultServerlessFunction = `
export default async function handler(ctx: Context) {
  return 'pong';
}
`.trimStart()
export enum SnippetType {
  JSON = 'json',
  JSON5 = 'json5',
  Function = 'function',
  Text = 'text',
  YAML = 'yaml',
}

export enum SnippetTypeToLanguage {
  json = 'json',
  json5 = 'plaintext',
  function = 'typescript',
  text = 'markdown',
  yaml = 'yaml',
}
export class SnippetModel extends BaseModel {
  type = SnippetType.JSON
  private = false
  raw = '{}'
  name = ''
  reference = 'root'
  comment?: string
  metatype?: string
  schema?: string

  // for serverless function
  enable?: boolean
  method?: string
}
