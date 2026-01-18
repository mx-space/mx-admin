import type { DecorationSet, EditorView } from '@codemirror/view'
import { Decoration, WidgetType, ViewPlugin } from '@codemirror/view'
import type { EditorState, Range } from '@codemirror/state'
import { codeToHtml } from 'shiki'

// Hidden marker widget - displays nothing
class HiddenMarkerWidget extends WidgetType {
  constructor(readonly marker: string) {
    super()
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = 'cm-wysiwyg-hidden-marker'
    span.textContent = this.marker
    return span
  }

  eq(other: HiddenMarkerWidget): boolean {
    return this.marker === other.marker
  }

  ignoreEvent(): boolean {
    return false
  }
}

// Link URL widget - shows a small link indicator
class LinkUrlWidget extends WidgetType {
  constructor(readonly url: string) {
    super()
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = 'cm-wysiwyg-link-url'
    span.textContent = `](${this.url})`
    span.title = this.url
    return span
  }

  eq(other: LinkUrlWidget): boolean {
    return this.url === other.url
  }

  ignoreEvent(): boolean {
    return false
  }
}

// Image widget - shows image preview
class ImageWidget extends WidgetType {
  constructor(
    readonly alt: string,
    readonly url: string,
  ) {
    super()
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('span')
    wrapper.className = 'cm-wysiwyg-image-wrapper'

    const img = document.createElement('img')
    img.src = this.url
    img.alt = this.alt
    img.className = 'cm-wysiwyg-image'
    img.title = this.alt || this.url

    wrapper.appendChild(img)
    return wrapper
  }

  eq(other: ImageWidget): boolean {
    return this.url === other.url && this.alt === other.alt
  }

  ignoreEvent(): boolean {
    return false
  }
}

// Inline code widget with shiki highlighting
class InlineCodeWidget extends WidgetType {
  private static highlightCache = new Map<string, string>()
  private static pendingHighlights = new Map<string, Promise<string>>()

  constructor(
    readonly code: string,
    readonly isDark: boolean,
  ) {
    super()
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = 'cm-wysiwyg-inline-code'
    span.textContent = this.code

    // Try to get cached highlight
    const cacheKey = `${this.code}:${this.isDark}`
    const cached = InlineCodeWidget.highlightCache.get(cacheKey)
    if (cached) {
      span.innerHTML = cached
      return span
    }

    // Check if highlight is already pending
    const pending = InlineCodeWidget.pendingHighlights.get(cacheKey)
    if (pending) {
      pending.then((html) => {
        if (span.isConnected) {
          span.innerHTML = html
        }
      })
      return span
    }

    // Start async highlight
    const highlightPromise = this.highlight()
    InlineCodeWidget.pendingHighlights.set(cacheKey, highlightPromise)

    highlightPromise.then((html) => {
      InlineCodeWidget.highlightCache.set(cacheKey, html)
      InlineCodeWidget.pendingHighlights.delete(cacheKey)
      if (span.isConnected) {
        span.innerHTML = html
      }
    })

    return span
  }

  private async highlight(): Promise<string> {
    try {
      const html = await codeToHtml(this.code, {
        lang: 'text',
        theme: this.isDark ? 'github-dark' : 'github-light',
      })
      // Extract just the code content, remove pre/code wrappers
      const match = html.match(/<code[^>]*>([\s\S]*?)<\/code>/)
      return match ? match[1] : this.code
    } catch {
      return this.code
    }
  }

  eq(other: InlineCodeWidget): boolean {
    return this.code === other.code && this.isDark === other.isDark
  }

  ignoreEvent(): boolean {
    return false
  }
}

interface InlineMatch {
  start: number
  end: number
  markerStart: string
  markerEnd: string
  contentStart: number
  contentEnd: number
  className: string
  // For links
  linkUrl?: string
  linkUrlStart?: number
  linkUrlEnd?: number
  // For images
  isImage?: boolean
  imageAlt?: string
  imageUrl?: string
  lineFrom?: number
  lineTo?: number
  // For inline code
  isInlineCode?: boolean
  codeContent?: string
}

// Find all inline patterns in a line
const findInlinePatterns = (
  lineText: string,
  lineFrom: number,
  lineTo: number,
): InlineMatch[] => {
  const matches: InlineMatch[] = []
  let match: RegExpExecArray | null

  // Inline code: `code` (must be before other patterns to avoid conflicts)
  const inlineCodeRegex = /`([^`]+)`/g
  while ((match = inlineCodeRegex.exec(lineText)) !== null) {
    matches.push({
      start: lineFrom + match.index,
      end: lineFrom + match.index + match[0].length,
      markerStart: '`',
      markerEnd: '`',
      contentStart: lineFrom + match.index + 1,
      contentEnd: lineFrom + match.index + match[0].length - 1,
      className: 'cm-wysiwyg-inline-code',
      isInlineCode: true,
      codeContent: match[1],
    })
  }

  // Image: ![alt](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  while ((match = imageRegex.exec(lineText)) !== null) {
    const fullMatch = match[0]
    const alt = match[1]
    const url = match[2]
    const matchStart = lineFrom + match.index

    matches.push({
      start: matchStart,
      end: matchStart + fullMatch.length,
      markerStart: '![',
      markerEnd: ']',
      contentStart: matchStart + 2,
      contentEnd: matchStart + 2 + alt.length,
      className: 'cm-wysiwyg-image',
      isImage: true,
      imageAlt: alt,
      imageUrl: url,
      lineFrom: lineFrom,
      lineTo: lineTo,
    })
  }

  // Bold: **text** or __text__
  const boldRegex = /(\*\*|__)(?!\s)(.+?)(?<!\s)\1/g
  while ((match = boldRegex.exec(lineText)) !== null) {
    const matchStart = lineFrom + match.index
    const matchEnd = matchStart + match[0].length

    if (isOverlapping(matches, matchStart, matchEnd)) continue

    matches.push({
      start: matchStart,
      end: matchEnd,
      markerStart: match[1],
      markerEnd: match[1],
      contentStart: matchStart + match[1].length,
      contentEnd: matchEnd - match[1].length,
      className: 'cm-wysiwyg-bold',
    })
  }

  // Strikethrough: ~~text~~
  const strikeRegex = /~~(?!\s)(.+?)(?<!\s)~~/g
  while ((match = strikeRegex.exec(lineText)) !== null) {
    const matchStart = lineFrom + match.index
    const matchEnd = matchStart + match[0].length

    if (isOverlapping(matches, matchStart, matchEnd)) continue

    matches.push({
      start: matchStart,
      end: matchEnd,
      markerStart: '~~',
      markerEnd: '~~',
      contentStart: matchStart + 2,
      contentEnd: matchEnd - 2,
      className: 'cm-wysiwyg-strikethrough',
    })
  }

  // Highlight: ==text==
  const highlightRegex = /==(?!\s)(.+?)(?<!\s)==/g
  while ((match = highlightRegex.exec(lineText)) !== null) {
    const matchStart = lineFrom + match.index
    const matchEnd = matchStart + match[0].length

    if (isOverlapping(matches, matchStart, matchEnd)) continue

    matches.push({
      start: matchStart,
      end: matchEnd,
      markerStart: '==',
      markerEnd: '==',
      contentStart: matchStart + 2,
      contentEnd: matchEnd - 2,
      className: 'cm-wysiwyg-highlight',
    })
  }

  // Link: [text](url) - but not images
  const linkRegex = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g
  while ((match = linkRegex.exec(lineText)) !== null) {
    const fullMatch = match[0]
    const text = match[1]
    const url = match[2]
    const matchStart = lineFrom + match.index

    if (isOverlapping(matches, matchStart, matchStart + fullMatch.length))
      continue

    matches.push({
      start: matchStart,
      end: matchStart + fullMatch.length,
      markerStart: '[',
      markerEnd: ']',
      contentStart: matchStart + 1,
      contentEnd: matchStart + 1 + text.length,
      className: 'cm-wysiwyg-link',
      linkUrl: url,
      linkUrlStart: matchStart + 1 + text.length,
      linkUrlEnd: matchStart + fullMatch.length,
    })
  }

  // Italic: *text* or _text_ (but not ** or __)
  const italicRegex =
    /(?<!\*)\*(?!\*)(?!\s)([^*]+?)(?<!\s)\*(?!\*)|(?<!_)_(?!_)(?!\s)([^_]+?)(?<!\s)_(?!_)/g
  while ((match = italicRegex.exec(lineText)) !== null) {
    const marker = match[0].startsWith('*') ? '*' : '_'
    const content = match[1] || match[2]
    const matchStart = lineFrom + match.index
    const matchEnd = matchStart + match[0].length

    if (isOverlapping(matches, matchStart, matchEnd)) continue

    if (content) {
      matches.push({
        start: matchStart,
        end: matchEnd,
        markerStart: marker,
        markerEnd: marker,
        contentStart: matchStart + 1,
        contentEnd: matchEnd - 1,
        className: 'cm-wysiwyg-italic',
      })
    }
  }

  return matches.sort((a, b) => a.start - b.start)
}

// Check if a range overlaps with existing matches
const isOverlapping = (
  matches: InlineMatch[],
  start: number,
  end: number,
): boolean => {
  return matches.some(
    (m) =>
      (start >= m.start && start < m.end) || (end > m.start && end <= m.end),
  )
}

// Cache for hidden marker widgets
const hiddenMarkerCache = new Map<string, HiddenMarkerWidget>()
const getHiddenMarker = (marker: string): HiddenMarkerWidget => {
  let widget = hiddenMarkerCache.get(marker)
  if (!widget) {
    widget = new HiddenMarkerWidget(marker)
    hiddenMarkerCache.set(marker, widget)
  }
  return widget
}

// Check if cursor is within a range
const isCursorInRange = (
  state: EditorState,
  start: number,
  end: number,
): boolean => {
  const { from, to } = state.selection.main
  return from < end && to > start
}

// Check if cursor is on a line
const isCursorOnLine = (
  state: EditorState,
  lineFrom: number,
  lineTo: number,
): boolean => {
  const { from, to } = state.selection.main
  return from <= lineTo && to >= lineFrom
}

// Detect dark mode
const isDarkMode = (): boolean => {
  return document.documentElement.classList.contains('dark')
}

const buildInlineDecorations = (state: EditorState): DecorationSet => {
  const decorations: Range<Decoration>[] = []
  const dark = isDarkMode()

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber++) {
    const line = state.doc.line(lineNumber)
    const matches = findInlinePatterns(line.text, line.from, line.to)

    for (const match of matches) {
      // For images, use line-level cursor detection
      const cursorInMatch = match.isImage
        ? isCursorOnLine(state, match.lineFrom!, match.lineTo!)
        : isCursorInRange(state, match.start, match.end)

      if (cursorInMatch) {
        // Only apply the style, don't hide markers
        if (!match.isImage) {
          decorations.push(
            Decoration.mark({ class: match.className }).range(
              match.contentStart,
              match.contentEnd,
            ),
          )
        }
      } else if (match.isImage && match.imageUrl) {
        // Replace entire image syntax with image widget
        decorations.push(
          Decoration.replace({
            widget: new ImageWidget(match.imageAlt || '', match.imageUrl),
          }).range(match.start, match.end),
        )
      } else if (match.isInlineCode && match.codeContent) {
        // Replace entire inline code with highlighted widget
        decorations.push(
          Decoration.replace({
            widget: new InlineCodeWidget(match.codeContent, dark),
          }).range(match.start, match.end),
        )
      } else {
        // Hide start marker
        decorations.push(
          Decoration.replace({
            widget: getHiddenMarker(match.markerStart),
          }).range(match.start, match.contentStart),
        )

        // Style the content
        decorations.push(
          Decoration.mark({ class: match.className }).range(
            match.contentStart,
            match.contentEnd,
          ),
        )

        // For links, handle the URL part specially
        if (match.linkUrl && match.linkUrlStart !== undefined) {
          decorations.push(
            Decoration.replace({
              widget: new LinkUrlWidget(match.linkUrl),
            }).range(match.contentEnd, match.end),
          )
        } else {
          // Hide end marker
          decorations.push(
            Decoration.replace({
              widget: getHiddenMarker(match.markerEnd),
            }).range(match.contentEnd, match.end),
          )
        }
      }
    }
  }

  decorations.sort((a, b) => a.from - b.from || a.to - b.to)
  return Decoration.set(decorations)
}

// Use ViewPlugin to react to selection changes
const inlineWysiwygPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildInlineDecorations(view.state)
    }

    update(update: {
      docChanged: boolean
      selectionSet: boolean
      state: EditorState
    }) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = buildInlineDecorations(update.state)
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
)

export const inlineWysiwygExtension = [inlineWysiwygPlugin]
