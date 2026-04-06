import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProviderGroup, SelectedModel } from './ModelSelector'

import { mount } from '@vue/test-utils'

import { ModelSelector } from './ModelSelector'

vi.mock('naive-ui', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    NPopselect: defineComponent({
      name: 'NPopselect',
      props: {
        options: {
          type: Array,
          default: () => [],
        },
        trigger: {
          type: String,
          default: '',
        },
        onUpdateValue: {
          type: Function,
          default: undefined,
        },
      },
      setup(props, { slots }) {
        return () => {
          const options = Array.isArray(props.options) ? props.options : []
          const buttons = options.flatMap((group: any) =>
            (group?.children ?? []).map((child: any) =>
              h(
                'button',
                {
                  type: 'button',
                  'data-select-value': child.value,
                  onClick: () => (props as any).onUpdateValue?.(child.value),
                },
                child.label,
              ),
            ),
          )

          return h(
            'div',
            { 'data-testid': 'popselect', 'data-trigger': props.trigger },
            [
              h('pre', { 'data-testid': 'options' }, JSON.stringify(options)),
              ...buttons,
              slots.header?.(),
              slots.default?.(),
            ],
          )
        }
      },
    }),
  }
})

const RECENT_MODELS_STORAGE_KEY = 'agent-chat:recent-models'

const providerGroups: ProviderGroup[] = [
  {
    id: 'claude',
    name: 'Claude',
    providerType: 'claude',
    models: [
      { id: 'sonnet-4', displayName: 'Sonnet 4' },
      { id: 'sonnet-3.7', displayName: 'Sonnet 3.7' },
      { id: 'haiku-3.5', displayName: 'Haiku 3.5' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    providerType: 'openai-compatible',
    models: [
      { id: 'gpt-4.1', displayName: 'GPT-4.1' },
      { id: 'gpt-4o', displayName: 'GPT-4o' },
      { id: 'o3-mini', displayName: 'o3-mini' },
    ],
  },
]

function createModel(
  providerId: string,
  modelId: string,
  providerType: SelectedModel['providerType'],
): SelectedModel {
  return { providerId, modelId, providerType }
}

function readRenderedOptions(wrapper: ReturnType<typeof mount>) {
  return JSON.parse(wrapper.get('[data-testid="options"]').text()) as Array<{
    label: string
    key: string
    children: Array<{ label: string; value: string }>
  }>
}

describe('ModelSelector', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders recent models as the first group and filters missing entries', () => {
    localStorage.setItem(
      RECENT_MODELS_STORAGE_KEY,
      JSON.stringify([
        createModel('missing', 'ghost', 'openai-compatible'),
        createModel('openai', 'gpt-4o', 'openai-compatible'),
      ]),
    )

    const wrapper = mount(ModelSelector, {
      props: {
        providerGroups,
        selectedModel: createModel('claude', 'sonnet-4', 'claude'),
      },
    })

    const options = readRenderedOptions(wrapper)

    expect(options[0]).toMatchObject({
      label: 'Recent',
      key: 'recent',
      children: [{ label: 'GPT-4o', value: 'openai::gpt-4o' }],
    })
    expect(options[1]?.label).toBe('Claude')
  })

  it('stores the newest selection at the front and keeps only five recent models', async () => {
    localStorage.setItem(
      RECENT_MODELS_STORAGE_KEY,
      JSON.stringify([
        createModel('claude', 'sonnet-4', 'claude'),
        createModel('openai', 'gpt-4.1', 'openai-compatible'),
        createModel('openai', 'gpt-4o', 'openai-compatible'),
        createModel('claude', 'sonnet-3.7', 'claude'),
        createModel('claude', 'haiku-3.5', 'claude'),
      ]),
    )

    const wrapper = mount(ModelSelector, {
      props: {
        providerGroups,
        selectedModel: createModel('claude', 'sonnet-4', 'claude'),
      },
    })

    await wrapper.get('[data-select-value="openai::o3-mini"]').trigger('click')

    expect(wrapper.emitted('selectModel')?.[0]).toEqual([
      createModel('openai', 'o3-mini', 'openai-compatible'),
    ])

    expect(
      JSON.parse(localStorage.getItem(RECENT_MODELS_STORAGE_KEY) || '[]'),
    ).toEqual([
      createModel('openai', 'o3-mini', 'openai-compatible'),
      createModel('claude', 'sonnet-4', 'claude'),
      createModel('openai', 'gpt-4.1', 'openai-compatible'),
      createModel('openai', 'gpt-4o', 'openai-compatible'),
      createModel('claude', 'sonnet-3.7', 'claude'),
    ])
  })

  it('uses click to open the popselect', () => {
    const wrapper = mount(ModelSelector, {
      props: {
        providerGroups,
        selectedModel: createModel('claude', 'sonnet-4', 'claude'),
      },
    })

    expect(
      wrapper.get('[data-testid="popselect"]').attributes('data-trigger'),
    ).toBe('click')
  })
})
