import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import type { Extension } from '@codemirror/state'
import { Compartment } from '@codemirror/state'

const extensionMap = {
  theme: new Compartment(),
  language: new Compartment(),
  fonts: new Compartment(),
}

export const codemirrorReconfigureExtension: Extension[] = [
  extensionMap.theme.of([]),
  extensionMap.language.of(
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
      addKeymap: true,
    }),
  ),
  extensionMap.fonts.of([]),
]

export { extensionMap as codemirrorReconfigureExtensionMap }
