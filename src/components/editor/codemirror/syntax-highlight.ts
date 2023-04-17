import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

const monoSpaceTags = [
  tags.bracket,
  tags.angleBracket,
  tags.squareBracket,
  tags.paren,
  tags.brace,
  tags.float,
  tags.monospace,
  tags.keyword,
  tags.character,
  tags.propertyName,
  tags.macroName,
  tags.function(tags.variableName),
  tags.labelName,
  tags.definition(tags.name),
  tags.typeName,
  tags.annotation,
  tags.modifier,
  tags.self,
  tags.namespace,
  tags.comment,
  tags.bool,
  /* @__PURE__ */ tags.special(tags.variableName),
  tags.className,
  tags.number,
  tags.changed,
  tags.operator,
  tags.operatorKeyword,
  tags.escape,
  tags.regexp,
  /* @__PURE__ */ tags.special(tags.string),
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
  ...monoSpaceTags.map((tag) => ({
    tag,
    fontFamily: `"OperatorMonoSSmLig Nerd Font","Cascadia Code PL","FantasqueSansMono Nerd Font","operator mono","Fira code Retina","Fira code","Consolas", Monaco, "Hannotate SC", monospace, -apple-system`,
  })),
])

export const syntaxTheme: Extension = [
  EditorView.theme({}),
  syntaxHighlighting(syntaxHighlightingStyle),
]
