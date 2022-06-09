export const EditorStorageKeys = {
  editor: 'editor-pref',
  general: 'editor-general',
} as const

export enum Editor {
  monaco = 'monaco',
  codemirror = 'codemirror',

  plain = 'plain',
}
