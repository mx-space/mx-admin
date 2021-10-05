import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { Compartment, Extension } from '@codemirror/state'
import { githubLightTheme } from '@ddietr/codemirror-themes/theme/github-light'

const extensionMap = {
  theme: new Compartment(),
  language: new Compartment(),
}

export const codemirrorReconfigureExtension: Extension[] = [
  extensionMap.theme.of(githubLightTheme),
  extensionMap.language.of(
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
      addKeymap: true,
    }),
  ),
]

export { extensionMap as codemirrorReconfigureExtensionMap }
