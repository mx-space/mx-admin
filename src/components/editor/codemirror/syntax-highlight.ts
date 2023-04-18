import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

const monospaceFonts = `"OperatorMonoSSmLig Nerd Font","Cascadia Code PL","FantasqueSansMono Nerd Font","operator mono","Fira code Retina","Fira code","Consolas", Monaco, "Hannotate SC", monospace, -apple-system`
const sansFonts = 'var(--sans-font)'
const markdownTags = [
  tags.heading1,
  tags.heading2,
  tags.heading3,
  tags.heading4,
  tags.heading5,
  tags.heading6,
  tags.strong,
  tags.emphasis,
  tags.deleted,
  tags.content,
  tags.url,
  tags.link,
]
export const syntaxHighlightingStyle = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontSize: '1.4em',
    fontWeight: 'bold',
  },
  {
    tag: tags.heading2,
    fontSize: '1.3em',
    fontWeight: 'bold',
  },
  {
    tag: tags.heading3,
    fontSize: '1.2em',
    fontWeight: 'bold',
  },
  {
    tag: tags.heading4,
    fontSize: '1.1em',
    fontWeight: 'bold',
  },
  {
    tag: tags.heading5,
    fontSize: '1.1em',
    fontWeight: 'bold',
  },
  {
    tag: tags.heading6,
    fontSize: '1.1em',
    fontWeight: 'bold',
  },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.deleted, textDecoration: 'line-through' },
  {
    tag: tags.url,
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  {
    tag: tags.link,
    textDecoration: 'underline',
    fontWeight: '500',
  },
  {
    tag: tags.processingInstruction,
    fontFamily: monospaceFonts,
  },

  ...markdownTags.map((tag) => ({ tag, fontFamily: sansFonts })),
])

export const syntaxTheme: Extension = [
  EditorView.theme({
    '.cm-scroller': {
      fontFamily: monospaceFonts,
    },
  }),
  syntaxHighlighting(syntaxHighlightingStyle),
]
