import { BaseModel } from './base'

export const defaultServerlessFunction = `
function handler(ctx, require) {
  return 'pong';
}
`
export enum SnippetType {
  JSON = 'json',
  Function = 'function',
  Text = 'text',
  YAML = 'yaml',
}

export enum SnippetTypeToLanguage {
  json = 'json',
  function = 'javascript',
  text = 'mark',
  yaml = 'yaml',
}
export class SnippetModel extends BaseModel {
  type = SnippetType.JSON
  private = true
  raw = '{}'
  name = ''
  reference = 'root'
  comment?: string
  metatype?: string
}
