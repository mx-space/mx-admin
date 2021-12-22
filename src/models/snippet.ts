import { BaseModel } from './base'
export enum SnippetType {
  JSON = 'json',
  // Function = 'function',
  Text = 'text',
  YAML = 'yaml',
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
