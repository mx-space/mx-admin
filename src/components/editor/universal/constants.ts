export const EditorStorageKeys = {
  editor: 'editor-pref',
  general: 'editor-general',

  vditor: 'editor-vditor-pref',
} as const

export enum Editor {
  monaco = 'monaco',
  vditor = 'vditor',
  plain = 'plain',
}
