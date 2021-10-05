import { HighlightStyle, tags } from '@codemirror/highlight'

export const syntaxHighlighting = HighlightStyle.define([
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
])
