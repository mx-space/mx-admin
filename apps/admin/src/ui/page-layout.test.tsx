import { Plus } from 'lucide-react'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Root } from 'react-dom/client'
import type { HeaderAction } from './page-layout'

import { PageHeader } from './page-layout'

interface Harness {
  container: HTMLDivElement
  root: Root
  unmount: () => void
}

function mount(): Harness {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  return {
    container,
    root,
    unmount: () => {
      act(() => {
        root.unmount()
      })
      container.remove()
    },
  }
}

function renderWithRouter(harness: Harness, element: React.ReactNode) {
  act(() => {
    harness.root.render(createElement(MemoryRouter, null, element))
  })
}

let harness: Harness

beforeEach(() => {
  harness = mount()
})

afterEach(() => {
  harness.unmount()
  document.body.innerHTML = ''
})

describe('PageHeader', () => {
  it('renders ReactNode actions as-is (legacy path)', () => {
    renderWithRouter(
      harness,
      createElement(PageHeader, {
        title: 'Title',
        actions: createElement(
          'button',
          { 'data-testid': 'legacy-action', type: 'button' },
          'Legacy Action',
        ),
      }),
    )
    const legacy = harness.container.querySelector(
      '[data-testid="legacy-action"]',
    )
    expect(legacy).not.toBeNull()
    expect(legacy!.textContent).toBe('Legacy Action')
  })

  it('renders typed button action with label in desktop variant', () => {
    const onClick = vi.fn()
    const actions: HeaderAction[] = [
      { kind: 'button', icon: Plus, label: 'Create', onClick },
    ]
    renderWithRouter(
      harness,
      createElement(PageHeader, { title: 'Title', actions }),
    )
    const buttons = harness.container.querySelectorAll(
      'button[aria-label="Create"]',
    )
    expect(buttons.length).toBe(2)
    const desktopButton = Array.from(buttons).find((b) =>
      b.className.includes('lg:inline-flex'),
    )
    expect(desktopButton).toBeDefined()
    expect(desktopButton!.textContent).toContain('Create')
  })

  it('renders typed button action as icon-only mobile variant', () => {
    const actions: HeaderAction[] = [
      { kind: 'button', icon: Plus, label: 'Create', onClick: vi.fn() },
    ]
    renderWithRouter(
      harness,
      createElement(PageHeader, { title: 'Title', actions }),
    )
    const buttons = harness.container.querySelectorAll(
      'button[aria-label="Create"]',
    )
    const mobileButton = Array.from(buttons).find((b) =>
      b.className.includes('lg:hidden'),
    )
    expect(mobileButton).toBeDefined()
    expect(mobileButton!.getAttribute('aria-label')).toBe('Create')
    expect(mobileButton!.getAttribute('title')).toBe('Create')
  })

  it('applies primary class when primary: true', () => {
    const actions: HeaderAction[] = [
      {
        kind: 'button',
        icon: Plus,
        label: 'Save',
        onClick: vi.fn(),
        primary: true,
      },
    ]
    renderWithRouter(
      harness,
      createElement(PageHeader, { title: 'Title', actions }),
    )
    const buttons = harness.container.querySelectorAll(
      'button[aria-label="Save"]',
    )
    expect(buttons.length).toBe(2)
    for (const button of buttons) {
      expect(button.className).toContain('bg-neutral-950')
    }
  })

  it('renders both node and mobileNode for kind: custom', () => {
    const actions: HeaderAction[] = [
      {
        kind: 'custom',
        node: createElement(
          'span',
          { 'data-testid': 'custom-desktop' },
          'Desktop',
        ),
        mobileNode: createElement(
          'span',
          { 'data-testid': 'custom-mobile' },
          'Mobile',
        ),
      },
    ]
    renderWithRouter(
      harness,
      createElement(PageHeader, { title: 'Title', actions }),
    )
    expect(
      harness.container.querySelector('[data-testid="custom-desktop"]'),
    ).not.toBeNull()
    expect(
      harness.container.querySelector('[data-testid="custom-mobile"]'),
    ).not.toBeNull()
  })
})
