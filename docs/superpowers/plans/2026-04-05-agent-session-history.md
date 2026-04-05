# Agent Session History — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to browse, switch, continue, rename, and delete multiple independent AI agent conversation sessions per article. On opening an article, restore the most recent session. Auto-generate session titles via the same LLM provider.

**Architecture:** Backend adds two schema fields (`reviewState`, `diffState`), a `messageCount` stored field, a `replaceMessages` service method, `PUT /conversations/:id/messages` and `PATCH /:id` endpoints, and async title generation in `appendMessages`. Frontend replaces `use-conversation-sync.ts` with a new `use-session-manager.ts` composable that owns session list state, switching/hydration, lazy creation with first message, session-scoped debounced full-replacement sync, and deletion. A new `SessionHeader.tsx` component provides the UI. `RichEditorWithAgent.tsx` wires the composable, exposes the real `agentLoop.abort()`, and passes session props to `AgentChatPanel`.

**Tech Stack:** NestJS + Typegoose + Zod (backend), Vue 3 TSX (defineComponent + JSX), Naive UI (`NPopover`, `NPopconfirm`, `NSpin`), `lucide-vue-next` icons, `@haklex/rich-agent-core` types, `ofetch`-based `request` utility.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `mx-core: .../ai-agent/ai-agent-conversation.model.ts` | **Modify** | Add `reviewState`, `diffState`, `messageCount` fields |
| `mx-core: .../ai-agent/ai-agent.schema.ts` | **Modify** | Add `UpdateConversationSchema` + DTO, `ReplaceMessagesSchema` + DTO |
| `mx-core: .../ai-agent/ai-agent-conversation.service.ts` | **Modify** | Add `updateById`, `replaceMessages` methods; title generation in `appendMessages`; `messageCount` in `listByRef` |
| `mx-core: .../ai-agent/ai-agent.controller.ts` | **Modify** | Add `PATCH /conversations/:id`, `PUT /conversations/:id/messages` endpoints |
| `admin-vue3: src/api/ai-agent.ts` | **Modify** | Add `updateConversation`, `replaceMessages`; update `AgentConversation` type with `messageCount` |
| `admin-vue3: src/components/.../composables/use-session-manager.ts` | **Create** | Session list, switching, hydration, lazy creation with first message, session-scoped debounced full-replacement sync, deletion, rename, error state |
| `admin-vue3: src/components/.../composables/use-conversation-sync.ts` | **Delete** | Replaced by session manager |
| `admin-vue3: src/components/.../agent-chat/SessionHeader.tsx` | **Create** | Session switcher dropdown, rename, new/delete buttons, loadError + retry UI |
| `admin-vue3: src/components/.../agent-chat/AgentChatPanel.tsx` | **Modify** | Insert `SessionHeader`, accept session + error props |
| `admin-vue3: src/components/.../rich/RichEditorWithAgent.tsx` | **Modify** | Replace `useConversationSync` with `useSessionManager`; expose `agentLoop.abort()` as real abort; pass session state |

---

### Task 1: Backend — Add `reviewState`, `diffState`, and `messageCount` fields to model

**Files:**
- Modify: `mx-core/apps/core/src/modules/ai/ai-agent/ai-agent-conversation.model.ts`

- [ ] **Step 1: Add the new fields to `AIAgentConversationModel`**

The full file after this change:

```typescript
import { index, modelOptions, prop, Severity } from '@typegoose/typegoose'
import mongoose from 'mongoose'

import { AI_AGENT_CONVERSATION_COLLECTION_NAME } from '~/constants/db.constant'
import { BaseModel } from '~/shared/model/base.model'

@modelOptions({
  options: {
    customName: AI_AGENT_CONVERSATION_COLLECTION_NAME,
    allowMixed: Severity.ALLOW,
  },
  schemaOptions: {
    timestamps: {
      createdAt: 'created',
      updatedAt: 'updated',
    },
  },
})
@index({ refId: 1, refType: 1 })
@index({ updated: -1 })
export class AIAgentConversationModel extends BaseModel {
  @prop({ required: true, type: mongoose.Schema.Types.ObjectId })
  refId: string

  @prop({ required: true })
  refType: string

  @prop()
  title?: string

  /**
   * Full conversation messages stored as JSON.
   * Uses rich-agent-core ChatMessage format verbatim.
   */
  @prop({ required: true, type: () => [mongoose.Schema.Types.Mixed] })
  messages: Record<string, unknown>[]

  @prop({ required: true })
  model: string

  @prop({ required: true })
  providerId: string

  @prop({ type: () => mongoose.Schema.Types.Mixed })
  reviewState?: Record<string, unknown>

  @prop({ type: () => mongoose.Schema.Types.Mixed })
  diffState?: Record<string, unknown>

  @prop({ default: 0 })
  messageCount: number

  updated?: Date
}
```

---

### Task 2: Backend — Add `UpdateConversationSchema`, `ReplaceMessagesSchema`, and DTOs

**Files:**
- Modify: `mx-core/apps/core/src/modules/ai/ai-agent/ai-agent.schema.ts`

- [ ] **Step 1: Add the Zod schemas and DTO classes after `AppendMessagesDto`**

The full file after this change:

```typescript
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

import { zMongoId } from '~/common/zod'

// --- Conversation CRUD ---

export const CreateConversationSchema = z.object({
  refId: zMongoId,
  refType: z.enum(['post', 'note', 'page']),
  title: z.string().optional(),
  messages: z.array(z.record(z.string(), z.unknown())).default([]),
  model: z.string().min(1),
  providerId: z.string().min(1),
})
export class CreateConversationDto extends createZodDto(
  CreateConversationSchema,
) {}

export const AppendMessagesSchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())).min(1),
})
export class AppendMessagesDto extends createZodDto(AppendMessagesSchema) {}

export const ReplaceMessagesSchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())),
})
export class ReplaceMessagesDto extends createZodDto(ReplaceMessagesSchema) {}

export const UpdateConversationSchema = z.object({
  title: z.string().optional(),
  reviewState: z.record(z.string(), z.unknown()).nullable().optional(),
  diffState: z.record(z.string(), z.unknown()).nullable().optional(),
})
export class UpdateConversationDto extends createZodDto(
  UpdateConversationSchema,
) {}

export const ListConversationsQuerySchema = z.object({
  refId: zMongoId,
  refType: z.enum(['post', 'note', 'page']),
})
export class ListConversationsQueryDto extends createZodDto(
  ListConversationsQuerySchema,
) {}

// --- Chat Proxy ---

export const ChatProxySchema = z.object({
  model: z.string().min(1),
  providerId: z.string().min(1),
  messages: z.array(z.record(z.string(), z.unknown())),
  tools: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        parameters: z.record(z.string(), z.unknown()),
      }),
    )
    .optional(),
})
export class ChatProxyDto extends createZodDto(ChatProxySchema) {}
```

---

### Task 3: Backend — Add `updateById` and `replaceMessages` service methods + title generation

**Files:**
- Modify: `mx-core/apps/core/src/modules/ai/ai-agent/ai-agent-conversation.service.ts`

- [ ] **Step 1: Inject `AiAgentChatService` into the constructor**

Add the import and update the constructor:

```typescript
import { AiAgentChatService } from './ai-agent-chat.service'
```

```typescript
  constructor(
    @InjectModel(AIAgentConversationModel)
    private readonly conversationModel: MongooseModel<AIAgentConversationModel>,
    private readonly chatService: AiAgentChatService,
  ) {}
```

- [ ] **Step 2: Update `create` to set `messageCount` from initial messages**

Replace the existing `create` method:

```typescript
  async create(data: {
    refId: string
    refType: string
    title?: string
    messages: Record<string, unknown>[]
    model: string
    providerId: string
  }) {
    return this.conversationModel.create({
      ...data,
      messageCount: data.messages.length,
    })
  }
```

- [ ] **Step 3: Update `listByRef` to include `messageCount` in the projection**

The existing `listByRef` already excludes `messages` with `{ messages: 0 }`. Since `messageCount` is a top-level stored field, it is included by default. No change needed — but verify this is the case. The current code:

```typescript
  async listByRef(refId: string, refType: string) {
    return this.conversationModel
      .find({ refId, refType }, { messages: 0 })
      .sort({ updated: -1 })
      .lean()
  }
```

This already returns `messageCount` since only `messages` (the array body) is excluded.

- [ ] **Step 4: Update `appendMessages` to increment `messageCount` and trigger title generation**

Replace the existing `appendMessages` method:

```typescript
  async appendMessages(id: string, messages: Record<string, unknown>[]) {
    const result = await this.conversationModel.findByIdAndUpdate(
      id,
      {
        $push: { messages: { $each: messages } },
        $set: { updated: new Date() },
        $inc: { messageCount: messages.length },
      },
      { returnDocument: 'after', lean: true },
    )
    if (!result) {
      throw new BizException(
        ErrorCodeEnum.ContentNotFoundCantProcess,
        'Conversation not found',
      )
    }

    if (
      !result.title &&
      messages.some((m) => m.role === 'assistant' || m.type === 'assistant')
    ) {
      this.generateTitle(id, result.messages, result.model, result.providerId)
    }

    const { messages: _messages, ...rest } = result
    return rest
  }
```

- [ ] **Step 5: Add `replaceMessages` method (full replacement for mutation-aware sync)**

Add after `appendMessages`:

```typescript
  async replaceMessages(id: string, messages: Record<string, unknown>[]) {
    const result = await this.conversationModel.findByIdAndUpdate(
      id,
      {
        $set: {
          messages,
          messageCount: messages.length,
          updated: new Date(),
        },
      },
      { returnDocument: 'after', projection: { messages: 0 }, lean: true },
    )
    if (!result) {
      throw new BizException(
        ErrorCodeEnum.ContentNotFoundCantProcess,
        'Conversation not found',
      )
    }
    return result
  }
```

- [ ] **Step 6: Add `updateById` method**

Add after `replaceMessages`:

```typescript
  async updateById(
    id: string,
    data: {
      title?: string
      reviewState?: Record<string, unknown> | null
      diffState?: Record<string, unknown> | null
    },
  ) {
    const $set: Record<string, unknown> = { updated: new Date() }
    if (data.title !== undefined) $set.title = data.title
    if (data.reviewState !== undefined) $set.reviewState = data.reviewState
    if (data.diffState !== undefined) $set.diffState = data.diffState

    const result = await this.conversationModel.findByIdAndUpdate(
      id,
      { $set },
      { returnDocument: 'after', projection: { messages: 0 }, lean: true },
    )
    if (!result) {
      throw new BizException(
        ErrorCodeEnum.ContentNotFoundCantProcess,
        'Conversation not found',
      )
    }
    return result
  }
```

- [ ] **Step 7: Add `generateTitle` private method**

Add at the bottom of the class:

```typescript
  private generateTitle(
    conversationId: string,
    allMessages: Record<string, unknown>[],
    model: string,
    providerId: string,
  ) {
    const firstUser = allMessages.find(
      (m) => m.role === 'user' || m.type === 'user',
    )
    const firstAssistant = allMessages.find(
      (m) => m.role === 'assistant' || m.type === 'assistant',
    )
    if (!firstUser || !firstAssistant) return

    const titleMessages: Record<string, unknown>[] = [
      {
        role: 'system',
        content: '用 10 字以内概括这段对话的主题，只返回标题文字',
      },
      { role: 'user', content: String(firstUser.content ?? '').slice(0, 500) },
      {
        role: 'assistant',
        content: String(firstAssistant.content ?? '').slice(0, 500),
      },
      { role: 'user', content: '请用 10 字以内概括以上对话主题' },
    ]

    this.chatService
      .resolveProvider(providerId)
      .then((provider) => {
        const { url, headers, body } = this.chatService.buildRequestBody(
          provider,
          model,
          titleMessages,
        )

        const bodyObj = JSON.parse(body)
        bodyObj.stream = false
        delete bodyObj.thinking
        delete bodyObj.tools

        return fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyObj),
        })
      })
      .then((res) => {
        if (!res.ok) throw new Error(`Title gen failed: ${res.status}`)
        return res.json()
      })
      .then((json: any) => {
        let title: string | undefined
        if (json.content?.[0]?.text) {
          title = json.content[0].text
        } else if (json.choices?.[0]?.message?.content) {
          title = json.choices[0].message.content
        }
        if (title) {
          title = title.replace(/^["'「]|["'」]$/g, '').trim().slice(0, 30)
          return this.conversationModel.updateOne(
            { _id: conversationId },
            { $set: { title } },
          )
        }
      })
      .catch((err) => {
        this.logger.warn(`Title generation failed for ${conversationId}: ${err.message}`)
      })
  }
```

The full file after all changes:

```typescript
import { Injectable, Logger } from '@nestjs/common'

import { BizException } from '~/common/exceptions/biz.exception'
import { ErrorCodeEnum } from '~/constants/error-code.constant'
import { InjectModel } from '~/transformers/model.transformer'

import { AiAgentChatService } from './ai-agent-chat.service'
import { AIAgentConversationModel } from './ai-agent-conversation.model'

@Injectable()
export class AiAgentConversationService {
  private readonly logger = new Logger(AiAgentConversationService.name)

  constructor(
    @InjectModel(AIAgentConversationModel)
    private readonly conversationModel: MongooseModel<AIAgentConversationModel>,
    private readonly chatService: AiAgentChatService,
  ) {}

  async create(data: {
    refId: string
    refType: string
    title?: string
    messages: Record<string, unknown>[]
    model: string
    providerId: string
  }) {
    return this.conversationModel.create({
      ...data,
      messageCount: data.messages.length,
    })
  }

  async listByRef(refId: string, refType: string) {
    return this.conversationModel
      .find({ refId, refType }, { messages: 0 })
      .sort({ updated: -1 })
      .lean()
  }

  async getById(id: string) {
    const doc = await this.conversationModel.findById(id).lean()
    if (!doc) {
      throw new BizException(
        ErrorCodeEnum.ContentNotFoundCantProcess,
        'Conversation not found',
      )
    }
    return doc
  }

  async appendMessages(id: string, messages: Record<string, unknown>[]) {
    const result = await this.conversationModel.findByIdAndUpdate(
      id,
      {
        $push: { messages: { $each: messages } },
        $set: { updated: new Date() },
        $inc: { messageCount: messages.length },
      },
      { returnDocument: 'after', lean: true },
    )
    if (!result) {
      throw new BizException(
        ErrorCodeEnum.ContentNotFoundCantProcess,
        'Conversation not found',
      )
    }

    if (
      !result.title &&
      messages.some((m) => m.role === 'assistant' || m.type === 'assistant')
    ) {
      this.generateTitle(id, result.messages, result.model, result.providerId)
    }

    const { messages: _messages, ...rest } = result
    return rest
  }

  async replaceMessages(id: string, messages: Record<string, unknown>[]) {
    const result = await this.conversationModel.findByIdAndUpdate(
      id,
      {
        $set: {
          messages,
          messageCount: messages.length,
          updated: new Date(),
        },
      },
      { returnDocument: 'after', projection: { messages: 0 }, lean: true },
    )
    if (!result) {
      throw new BizException(
        ErrorCodeEnum.ContentNotFoundCantProcess,
        'Conversation not found',
      )
    }
    return result
  }

  async updateById(
    id: string,
    data: {
      title?: string
      reviewState?: Record<string, unknown> | null
      diffState?: Record<string, unknown> | null
    },
  ) {
    const $set: Record<string, unknown> = { updated: new Date() }
    if (data.title !== undefined) $set.title = data.title
    if (data.reviewState !== undefined) $set.reviewState = data.reviewState
    if (data.diffState !== undefined) $set.diffState = data.diffState

    const result = await this.conversationModel.findByIdAndUpdate(
      id,
      { $set },
      { returnDocument: 'after', projection: { messages: 0 }, lean: true },
    )
    if (!result) {
      throw new BizException(
        ErrorCodeEnum.ContentNotFoundCantProcess,
        'Conversation not found',
      )
    }
    return result
  }

  async deleteById(id: string) {
    await this.conversationModel.deleteOne({ _id: id })
  }

  private generateTitle(
    conversationId: string,
    allMessages: Record<string, unknown>[],
    model: string,
    providerId: string,
  ) {
    const firstUser = allMessages.find(
      (m) => m.role === 'user' || m.type === 'user',
    )
    const firstAssistant = allMessages.find(
      (m) => m.role === 'assistant' || m.type === 'assistant',
    )
    if (!firstUser || !firstAssistant) return

    const titleMessages: Record<string, unknown>[] = [
      {
        role: 'system',
        content: '用 10 字以内概括这段对话的主题，只返回标题文字',
      },
      { role: 'user', content: String(firstUser.content ?? '').slice(0, 500) },
      {
        role: 'assistant',
        content: String(firstAssistant.content ?? '').slice(0, 500),
      },
      { role: 'user', content: '请用 10 字以内概括以上对话主题' },
    ]

    this.chatService
      .resolveProvider(providerId)
      .then((provider) => {
        const { url, headers, body } = this.chatService.buildRequestBody(
          provider,
          model,
          titleMessages,
        )

        const bodyObj = JSON.parse(body)
        bodyObj.stream = false
        delete bodyObj.thinking
        delete bodyObj.tools

        return fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyObj),
        })
      })
      .then((res) => {
        if (!res.ok) throw new Error(`Title gen failed: ${res.status}`)
        return res.json()
      })
      .then((json: any) => {
        let title: string | undefined
        if (json.content?.[0]?.text) {
          title = json.content[0].text
        } else if (json.choices?.[0]?.message?.content) {
          title = json.choices[0].message.content
        }
        if (title) {
          title = title.replace(/^["'「]|["'」]$/g, '').trim().slice(0, 30)
          return this.conversationModel.updateOne(
            { _id: conversationId },
            { $set: { title } },
          )
        }
      })
      .catch((err) => {
        this.logger.warn(`Title generation failed for ${conversationId}: ${err.message}`)
      })
  }
}
```

**Commit:** `git commit -m "feat(ai-agent): add reviewState/diffState/messageCount fields, updateById, replaceMessages, and title generation"`

---

### Task 4: Backend — Add `PATCH /conversations/:id` and `PUT /conversations/:id/messages` controller endpoints

**Files:**
- Modify: `mx-core/apps/core/src/modules/ai/ai-agent/ai-agent.controller.ts`

- [ ] **Step 1: Import the new DTOs**

Update the import from `./ai-agent.schema` to include all new DTOs:

```typescript
import {
  AppendMessagesDto,
  ChatProxyDto,
  CreateConversationDto,
  ListConversationsQueryDto,
  ReplaceMessagesDto,
  UpdateConversationDto,
} from './ai-agent.schema'
```

Also add the `Put` decorator to the NestJS import:

```typescript
import {
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common'
```

- [ ] **Step 2: Add the `PATCH /conversations/:id` endpoint**

Add after `getConversation` and before `appendMessages`:

```typescript
  @Patch('/conversations/:id')
  @Auth()
  async updateConversation(
    @Param() params: MongoIdDto,
    @Body() body: UpdateConversationDto,
  ) {
    return this.conversationService.updateById(params.id, body)
  }
```

- [ ] **Step 3: Add the `PUT /conversations/:id/messages` endpoint**

Add after the `appendMessages` method:

```typescript
  @Put('/conversations/:id/messages')
  @Auth()
  async replaceMessages(
    @Param() params: MongoIdDto,
    @Body() body: ReplaceMessagesDto,
  ) {
    return this.conversationService.replaceMessages(params.id, body.messages)
  }
```

The Conversation CRUD section of the controller after all changes:

```typescript
  // --- Conversation CRUD ---

  @Post('/conversations')
  @Auth()
  async createConversation(@Body() body: CreateConversationDto) {
    return this.conversationService.create(body)
  }

  @Get('/conversations')
  @Auth()
  async listConversations(@Query() query: ListConversationsQueryDto) {
    return this.conversationService.listByRef(query.refId, query.refType)
  }

  @Get('/conversations/:id')
  @Auth()
  async getConversation(@Param() params: MongoIdDto) {
    return this.conversationService.getById(params.id)
  }

  @Patch('/conversations/:id')
  @Auth()
  async updateConversation(
    @Param() params: MongoIdDto,
    @Body() body: UpdateConversationDto,
  ) {
    return this.conversationService.updateById(params.id, body)
  }

  @Patch('/conversations/:id/messages')
  @Auth()
  async appendMessages(
    @Param() params: MongoIdDto,
    @Body() body: AppendMessagesDto,
  ) {
    return this.conversationService.appendMessages(params.id, body.messages)
  }

  @Put('/conversations/:id/messages')
  @Auth()
  async replaceMessages(
    @Param() params: MongoIdDto,
    @Body() body: ReplaceMessagesDto,
  ) {
    return this.conversationService.replaceMessages(params.id, body.messages)
  }

  @Delete('/conversations/:id')
  @Auth()
  async deleteConversation(@Param() params: MongoIdDto) {
    return this.conversationService.deleteById(params.id)
  }
```

**Commit:** `git commit -m "feat(ai-agent): add PATCH /conversations/:id and PUT /conversations/:id/messages endpoints"`

---

### Task 5: Frontend — Update API client

**Files:**
- Modify: `src/api/ai-agent.ts`

- [ ] **Step 1: Add `messageCount` to the interface, add `updateConversation` and `replaceMessages` methods**

Full file replacement:

```typescript
import { request } from '~/utils/request'

export interface AgentConversation {
  id: string
  refId: string
  refType: string
  title?: string
  model: string
  providerId: string
  created: string
  updated: string
  messageCount: number
  messages?: Record<string, unknown>[]
  reviewState?: Record<string, unknown>
  diffState?: Record<string, unknown>
}

export const aiAgentApi = {
  createConversation: (data: {
    refId: string
    refType: string
    model: string
    providerId: string
    title?: string
    messages?: Record<string, unknown>[]
  }) => request.post<AgentConversation>('/ai/agent/conversations', { data }),

  listConversations: (refId: string, refType: string) =>
    request.get<AgentConversation[]>('/ai/agent/conversations', {
      params: { refId, refType },
    }),

  getConversation: (id: string) =>
    request.get<AgentConversation>(`/ai/agent/conversations/${id}`),

  appendMessages: (id: string, messages: Record<string, unknown>[]) =>
    request.patch<AgentConversation>(`/ai/agent/conversations/${id}/messages`, {
      data: { messages },
    }),

  replaceMessages: (id: string, messages: Record<string, unknown>[]) =>
    request.put<AgentConversation>(`/ai/agent/conversations/${id}/messages`, {
      data: { messages },
    }),

  updateConversation: (
    id: string,
    data: {
      title?: string
      reviewState?: Record<string, unknown> | null
      diffState?: Record<string, unknown> | null
    },
  ) => request.patch<AgentConversation>(`/ai/agent/conversations/${id}`, { data }),

  deleteConversation: (id: string) =>
    request.delete<void>(`/ai/agent/conversations/${id}`),
}
```

**Verify:** `npx tsc --noEmit` from `admin-vue3` root — expect no new errors.

**Commit:** `git commit -m "feat(api): add replaceMessages, updateConversation, messageCount to AgentConversation"`

---

### Task 6: Frontend — Create `use-session-manager.ts` — types and reactive state

**Files:**
- Create: `src/components/editor/rich/agent-chat/composables/use-session-manager.ts`

- [ ] **Step 1: Create file with imports, types, and the composable skeleton**

```typescript
import { onUnmounted, ref, watch } from 'vue'
import type { AgentStore, ChatBubble, DiffState, ReviewState } from '@haklex/rich-agent-core'
import type { Ref } from 'vue'

import { useMessage } from 'naive-ui'

import { aiAgentApi } from '~/api/ai-agent'
import type { AgentConversation } from '~/api/ai-agent'

export interface SessionMeta {
  id: string
  title?: string
  updated: string
  messageCount: number
}

interface SessionManagerOptions {
  store: AgentStore
  refId: Ref<string | undefined>
  refType: 'post' | 'note' | 'page'
  getModel: () => string
  getProviderId: () => string
  abortFn: () => void
}

function toSessionMeta(conv: AgentConversation): SessionMeta {
  return {
    id: conv.id,
    title: conv.title,
    updated: conv.updated,
    messageCount: conv.messageCount ?? conv.messages?.length ?? 0,
  }
}
```

---

### Task 7: Frontend — Session manager — `loadSessions` and `switchSession`

**Files:**
- Modify: `src/components/editor/rich/agent-chat/composables/use-session-manager.ts`

- [ ] **Step 1: Add the main `useSessionManager` function with state, `loadSessions`, and `switchSession`**

Append to the file created in Task 6:

```typescript
export function useSessionManager(options: SessionManagerOptions) {
  const { store, refId, refType, getModel, getProviderId, abortFn } = options

  const message = useMessage()

  const sessions = ref<SessionMeta[]>([])
  const activeSessionId = ref<string | null>(null)
  const isHydrating = ref(false)
  const isLoading = ref(false)
  const loadError = ref(false)
  const isPendingCreation = ref(false)

  let sessionEpoch = 0
  let pendingSync: { sessionId: string; cancel: () => void } | null = null
  let diffSyncTimer: ReturnType<typeof setTimeout> | null = null

  async function loadSessions() {
    const id = refId.value
    if (!id) return

    isLoading.value = true
    loadError.value = false
    try {
      const list = await aiAgentApi.listConversations(id, refType)
      const normalized = Array.isArray(list) ? list : (list as any)?.data ?? []
      sessions.value = normalized.map(toSessionMeta)

      if (sessions.value.length > 0 && !activeSessionId.value) {
        await switchSession(sessions.value[0].id)
      }
    } catch {
      sessions.value = []
      loadError.value = true
    } finally {
      isLoading.value = false
    }
  }

  async function switchSession(id: string) {
    flushPendingSync()

    const epoch = ++sessionEpoch

    abortFn()
    isHydrating.value = true
    activeSessionId.value = id
    isPendingCreation.value = false
    store.getState().reset()

    try {
      const detail = await aiAgentApi.getConversation(id)
      if (epoch !== sessionEpoch) return

      const rawMessages = detail.messages ?? []
      const validBubbles = rawMessages
        .filter((m): m is Record<string, unknown> => {
          const t = m.type ?? m.role
          return typeof t === 'string' && t.length > 0
        })
        .map((m) => {
          const bubble = { ...m } as Record<string, unknown>
          if ('streaming' in bubble) bubble.streaming = false
          if ('isStreaming' in bubble) bubble.isStreaming = false
          return bubble as unknown as ChatBubble
        })

      store.setState({ bubbles: validBubbles, status: 'idle' } as any)

      if (detail.reviewState) {
        store.getState().setReviewState(detail.reviewState as unknown as ReviewState)
      }
      if (detail.diffState) {
        store.getState().setDiffState(detail.diffState as unknown as DiffState)
      }

      const meta = sessions.value.find((s) => s.id === id)
      if (meta) {
        meta.title = detail.title
        meta.messageCount = validBubbles.length
      }
    } catch {
      store.setState({ bubbles: [], status: 'idle' } as any)
      message.error('会话恢复失败')
    } finally {
      if (epoch === sessionEpoch) {
        isHydrating.value = false
      }
    }
  }
```

---

### Task 8: Frontend — Session manager — `createSession` and `deleteSession`

**Files:**
- Modify: `src/components/editor/rich/agent-chat/composables/use-session-manager.ts`

- [ ] **Step 1: Add `createSession` and `deleteSession` methods**

Append inside the `useSessionManager` function (before the return):

```typescript
  function createSession() {
    flushPendingSync()
    abortFn()
    store.getState().reset()
    activeSessionId.value = null
    isPendingCreation.value = true
    sessionEpoch++
  }

  async function deleteSession(id: string) {
    if (activeSessionId.value === id) {
      flushPendingSync()
    }

    try {
      await aiAgentApi.deleteConversation(id)
    } catch {
      return
    }

    sessions.value = sessions.value.filter((s) => s.id !== id)

    if (activeSessionId.value === id) {
      if (sessions.value.length > 0) {
        await switchSession(sessions.value[0].id)
      } else {
        activeSessionId.value = null
        isPendingCreation.value = false
        store.getState().reset()
        sessionEpoch++
      }
    }
  }
```

---

### Task 9: Frontend — Session manager — `renameSession`

**Files:**
- Modify: `src/components/editor/rich/agent-chat/composables/use-session-manager.ts`

- [ ] **Step 1: Add `renameSession` method**

Append inside the `useSessionManager` function:

```typescript
  async function renameSession(id: string, title: string) {
    try {
      await aiAgentApi.updateConversation(id, { title })
      const meta = sessions.value.find((s) => s.id === id)
      if (meta) meta.title = title
    } catch {}
  }
```

---

### Task 10: Frontend — Session manager — session-scoped sync with full message replacement

**Files:**
- Modify: `src/components/editor/rich/agent-chat/composables/use-session-manager.ts`

- [ ] **Step 1: Add the session-scoped `syncMessages`, `scheduleSyncMessages`, `flushPendingSync`, and `scheduleDiffSync` functions**

Append inside the `useSessionManager` function:

```typescript
  function syncMessages(sessionId: string) {
    const bubbles = store.getState().bubbles
    if (bubbles.length === 0) return
    const messages = bubbles as unknown as Record<string, unknown>[]
    aiAgentApi.replaceMessages(sessionId, messages).catch(() => {})
  }

  function scheduleSyncMessages() {
    const capturedId = activeSessionId.value
    if (!capturedId) return

    pendingSync?.cancel()
    const timer = setTimeout(() => {
      if (activeSessionId.value === capturedId) {
        syncMessages(capturedId)
      }
      pendingSync = null
    }, 2000)
    pendingSync = {
      sessionId: capturedId,
      cancel: () => clearTimeout(timer),
    }
  }

  function flushPendingSync() {
    if (pendingSync) {
      const { sessionId, cancel } = pendingSync
      cancel()
      syncMessages(sessionId)
      pendingSync = null
    }
  }

  function scheduleDiffSync() {
    if (diffSyncTimer) clearTimeout(diffSyncTimer)
    const capturedId = activeSessionId.value
    if (!capturedId) return
    diffSyncTimer = setTimeout(() => {
      if (activeSessionId.value !== capturedId) return
      const state = store.getState()
      aiAgentApi
        .updateConversation(capturedId, {
          reviewState: (state.reviewState as unknown as Record<string, unknown>) ?? null,
          diffState: (state.diffState as unknown as Record<string, unknown>) ?? null,
        })
        .catch(() => {})
    }, 2000)
  }
```

- [ ] **Step 2: Add the store subscription with lazy creation including first message**

```typescript
  const unsubscribe = store.subscribe((state) => {
    if (isHydrating.value) return

    const currentBubbles = state.bubbles
    if (currentBubbles.length === 0) return

    const rid = refId.value
    if (!rid) return

    const epoch = sessionEpoch

    if (!activeSessionId.value && isPendingCreation.value) {
      isPendingCreation.value = false
      const messages = currentBubbles as unknown as Record<string, unknown>[]
      aiAgentApi
        .createConversation({
          refId: rid,
          refType,
          model: getModel(),
          providerId: getProviderId(),
          messages,
        })
        .then((conv) => {
          if (epoch !== sessionEpoch) return
          activeSessionId.value = conv.id
          sessions.value.unshift(toSessionMeta(conv))
          setTimeout(() => loadSessions(), 5000)
        })
        .catch(() => {})
      return
    }

    if (!activeSessionId.value && !isPendingCreation.value) {
      isPendingCreation.value = true
      const messages = currentBubbles as unknown as Record<string, unknown>[]
      aiAgentApi
        .createConversation({
          refId: rid,
          refType,
          model: getModel(),
          providerId: getProviderId(),
          messages,
        })
        .then((conv) => {
          if (epoch !== sessionEpoch) return
          activeSessionId.value = conv.id
          isPendingCreation.value = false
          sessions.value.unshift(toSessionMeta(conv))
          setTimeout(() => loadSessions(), 5000)
        })
        .catch(() => {
          isPendingCreation.value = false
        })
      return
    }

    if (activeSessionId.value) {
      scheduleSyncMessages()
    }

    scheduleDiffSync()
  })

  onUnmounted(() => {
    flushPendingSync()
    unsubscribe()
    if (diffSyncTimer) clearTimeout(diffSyncTimer)
  })
```

**Key design decisions for this subscription:**

1. **Full replacement via PUT** instead of append-only: `@haklex/rich-agent-core` mutates bubbles in-place via `updateLastBubble`, `updateToolCallItem`, and `store.setState({ bubbles: nextBubbles })`. An append-only sync (`state.bubbles.slice(lastSyncedLength)`) misses these mutations, causing restored sessions to have truncated assistant messages and incomplete tool calls. Debounced full replacement catches all mutations.

2. **Session-scoped sync**: `scheduleSyncMessages` captures `activeSessionId` at schedule time. If the user switches sessions before the timer fires, the timer checks `activeSessionId === capturedId` and discards stale writes. `flushPendingSync()` is called before `switchSession` and `deleteSession` to ensure pending writes land on the correct session.

3. **Lazy creation includes first message**: `POST /conversations` includes `messages: [firstBubble]` rather than creating empty then appending, matching the spec.

4. **Delayed `loadSessions` for title pickup**: After lazy creation, a 5-second delayed `loadSessions()` picks up the server-generated title from `generateTitle` (which runs asynchronously in `appendMessages`).

---

### Task 11: Frontend — Session manager — `refId` watcher and return value

**Files:**
- Modify: `src/components/editor/rich/agent-chat/composables/use-session-manager.ts`

- [ ] **Step 1: Add refId watcher with full reset on change, and the return statement**

Append at the end of the `useSessionManager` function:

```typescript
  watch(
    refId,
    (newId, oldId) => {
      if (newId === oldId) return
      if (oldId) {
        flushPendingSync()
        sessions.value = []
        activeSessionId.value = null
        isPendingCreation.value = false
        store.getState().reset()
        sessionEpoch++
      }
      if (newId) {
        loadSessions()
      }
    },
    { immediate: true },
  )

  return {
    sessions,
    activeSessionId,
    isHydrating,
    isLoading,
    loadError,
    loadSessions,
    switchSession,
    createSession,
    deleteSession,
    renameSession,
  }
}
```

**Verify:** `npx tsc --noEmit` from `admin-vue3` root — expect no new errors related to session-manager.

**Commit:** `git commit -m "feat(agent-chat): add use-session-manager composable with full-replacement sync"`

---

### Task 12: Frontend — Create `SessionHeader.tsx` — component shell and layout

**Files:**
- Create: `src/components/editor/rich/agent-chat/SessionHeader.tsx`

- [ ] **Step 1: Create the component with imports and props definition**

```tsx
import { ChevronDown, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import { NPopconfirm, NPopover, NSpin } from 'naive-ui'
import { computed, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import type { SessionMeta } from './composables/use-session-manager'

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

export const SessionHeader = defineComponent({
  name: 'SessionHeader',
  props: {
    sessions: {
      type: Array as PropType<SessionMeta[]>,
      required: true,
    },
    activeSessionId: {
      type: String as PropType<string | null>,
      default: null,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    loadError: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['switchSession', 'createSession', 'deleteSession', 'renameSession', 'retry'],
  setup(props, { emit }) {
    const dropdownVisible = ref(false)
    const isEditing = ref(false)
    const editValue = ref('')

    const activeSession = computed(() =>
      props.sessions.find((s) => s.id === props.activeSessionId),
    )

    const displayTitle = computed(
      () => activeSession.value?.title || '未命名对话',
    )

    const sortedSessions = computed(() =>
      [...props.sessions].sort(
        (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime(),
      ),
    )

    function handleStartEdit() {
      isEditing.value = true
      editValue.value = activeSession.value?.title || ''
    }

    function handleFinishEdit() {
      isEditing.value = false
      const trimmed = editValue.value.trim()
      if (trimmed && props.activeSessionId) {
        emit('renameSession', props.activeSessionId, trimmed)
      }
    }

    function handleEditKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleFinishEdit()
      }
      if (e.key === 'Escape') {
        isEditing.value = false
      }
    }

    function handleSelectSession(id: string) {
      dropdownVisible.value = false
      if (id !== props.activeSessionId) {
        emit('switchSession', id)
      }
    }

    return () => (
      <div class="flex h-9 flex-shrink-0 items-center justify-between border-b border-neutral-200 px-3 dark:border-neutral-700">
        {props.loadError ? (
          <button
            class="flex flex-1 cursor-pointer items-center gap-1.5 text-xs text-red-500"
            onClick={() => emit('retry')}
          >
            <RefreshCw class="h-3 w-3" />
            加载失败，点击重试
          </button>
        ) : (
          <>
            <div class="flex min-w-0 flex-1 items-center gap-1">
              {isEditing.value ? (
                <input
                  class="h-6 min-w-0 flex-1 rounded border border-neutral-300 bg-transparent px-1.5 text-xs font-semibold text-neutral-800 outline-none focus:border-blue-400 dark:border-neutral-600 dark:text-neutral-200"
                  value={editValue.value}
                  onInput={(e) => {
                    editValue.value = (e.target as HTMLInputElement).value
                  }}
                  onBlur={handleFinishEdit}
                  onKeydown={handleEditKeydown}
                  autofocus
                />
              ) : (
                <NPopover
                  trigger="click"
                  placement="bottom-start"
                  show={dropdownVisible.value}
                  onUpdateShow={(v: boolean) => {
                    dropdownVisible.value = v
                  }}
                  raw
                  style={{ padding: 0 }}
                >
                  {{
                    trigger: () => (
                      <button
                        class="flex min-w-0 cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        onDblclick={handleStartEdit}
                      >
                        <span class="truncate">{displayTitle.value}</span>
                        <ChevronDown class="h-3 w-3 flex-shrink-0 opacity-50" />
                      </button>
                    ),
                    default: () => (
                      <div class="w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                        {props.isLoading ? (
                          <div class="flex items-center justify-center py-6">
                            <NSpin size="small" />
                          </div>
                        ) : sortedSessions.value.length === 0 ? (
                          <div class="px-3 py-4 text-center text-xs text-neutral-400">
                            暂无历史对话
                          </div>
                        ) : (
                          <div class="max-h-64 overflow-y-auto py-1">
                            {sortedSessions.value.map((session) => (
                              <button
                                key={session.id}
                                class={[
                                  'flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2 text-left transition-colors',
                                  session.id === props.activeSessionId
                                    ? 'bg-neutral-100 dark:bg-neutral-800'
                                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                                ]}
                                onClick={() => handleSelectSession(session.id)}
                              >
                                <span class="truncate text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                  {session.title || '未命名对话'}
                                </span>
                                <span class="text-xs text-neutral-400">
                                  {formatRelativeTime(session.updated)}
                                  {' · '}
                                  {session.messageCount} 条消息
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ),
                  }}
                </NPopover>
              )}
            </div>

            <div class="flex items-center gap-0.5">
              <button
                class="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                title="新建对话"
                onClick={() => emit('createSession')}
              >
                <Plus class="h-3.5 w-3.5" />
              </button>

              {props.activeSessionId && (
                <NPopconfirm
                  onPositiveClick={() => {
                    if (props.activeSessionId) {
                      emit('deleteSession', props.activeSessionId)
                    }
                  }}
                >
                  {{
                    trigger: () => (
                      <button
                        class="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                        title="删除对话"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </button>
                    ),
                    default: () => '确定删除这个对话吗？',
                  }}
                </NPopconfirm>
              )}
            </div>
          </>
        )}
      </div>
    )
  },
})
```

**Verify:** `npx tsc --noEmit` — expect no errors.

**Commit:** `git commit -m "feat(agent-chat): add SessionHeader component with loadError retry"`

---

### Task 13: Frontend — Integrate `SessionHeader` into `AgentChatPanel`

**Files:**
- Modify: `src/components/editor/rich/agent-chat/AgentChatPanel.tsx`

- [ ] **Step 1: Add imports for SessionHeader and its types**

Add after the existing imports:

```typescript
import { SessionHeader } from './SessionHeader'
import type { SessionMeta } from './composables/use-session-manager'
```

- [ ] **Step 2: Add `NSpin` import**

```typescript
import { NSpin } from 'naive-ui'
```

- [ ] **Step 3: Add session-related props**

Add these props to the `props` object (after `isReplayableItem`):

```typescript
    sessions: {
      type: Array as PropType<SessionMeta[]>,
      default: () => [],
    },
    activeSessionId: {
      type: String as PropType<string | null>,
      default: null,
    },
    isSessionLoading: {
      type: Boolean,
      default: false,
    },
    isHydrating: {
      type: Boolean,
      default: false,
    },
    loadError: {
      type: Boolean,
      default: false,
    },
```

- [ ] **Step 4: Add session-related emits**

Add to the `emits` array:

```typescript
    'switchSession',
    'createSession',
    'deleteSession',
    'renameSession',
    'retryLoad',
```

- [ ] **Step 5: Insert SessionHeader into the render function and add hydrating overlay**

Replace the return JSX in the `setup` function with:

```tsx
    return () => (
      <div class="flex h-full min-h-0 flex-col overflow-hidden text-sm">
        <SessionHeader
          sessions={props.sessions}
          activeSessionId={props.activeSessionId}
          isLoading={props.isSessionLoading}
          loadError={props.loadError}
          onSwitchSession={(id: string) => emit('switchSession', id)}
          onCreateSession={() => emit('createSession')}
          onDeleteSession={(id: string) => emit('deleteSession', id)}
          onRenameSession={(id: string, title: string) =>
            emit('renameSession', id, title)
          }
          onRetry={() => emit('retryLoad')}
        />
        {props.isHydrating ? (
          <div class="flex flex-1 items-center justify-center">
            <NSpin size="small" />
          </div>
        ) : (
          <>
            <ChatMessageList
              bubbles={bubbles.value}
              getBatch={getBatch}
              replayState={props.replayState}
              isReplayableItem={props.isReplayableItem}
              onAcceptBatch={(id: string) => emit('acceptBatch', id)}
              onRejectBatch={(id: string) => emit('rejectBatch', id)}
              onReapplyItem={(itemId: string, item: ToolCallGroupItem) =>
                emit('reapplyItem', itemId, item)
              }
              onReapplyGroup={(groupId: string, items: ToolCallGroupItem[]) =>
                emit('reapplyGroup', groupId, items)
              }
              onReapplyBatch={(batchId: string) => emit('reapplyBatch', batchId)}
              onRetry={() => emit('retry')}
            />
            <ChatInput
              disabled={!hasModel.value}
              isRunning={isRunning.value}
              status={status.value}
              onSend={handleSend}
              onAbort={() => emit('abort')}
            >
              {{
                modelSelector: () => (
                  <ModelSelector
                    providerGroups={props.providerGroups}
                    selectedModel={props.selectedModel}
                    onSelectModel={(model: SelectedModel) =>
                      emit('selectModel', model)
                    }
                  />
                ),
              }}
            </ChatInput>
          </>
        )}
      </div>
    )
```

The full updated file:

```tsx
import { computed, defineComponent } from 'vue'
import type { ReviewBatch, ToolCallGroupItem } from '@haklex/rich-agent-core'
import type { PropType } from 'vue'
import type { ReplayStateMap } from './composables/use-agent-reapply'
import type { ProviderGroup, SelectedModel } from './ModelSelector'
import type { SessionMeta } from './composables/use-session-manager'

import { NSpin } from 'naive-ui'
import { agentStoreSelectors } from '@haklex/rich-agent-core'

import { ChatInput } from './ChatInput'
import { ChatMessageList } from './ChatMessageList'
import {
  useAgentStore,
  useAgentStoreSelector,
} from './composables/use-agent-store'
import { ModelSelector } from './ModelSelector'
import { SessionHeader } from './SessionHeader'

export const AgentChatPanel = defineComponent({
  name: 'AgentChatPanel',
  props: {
    providerGroups: {
      type: Array as PropType<ProviderGroup[]>,
      required: true,
    },
    selectedModel: {
      type: Object as PropType<SelectedModel | null>,
      default: null,
    },
    replayState: {
      type: Object as PropType<ReplayStateMap>,
      default: () => ({}),
    },
    isReplayableItem: {
      type: Function as PropType<(item: ToolCallGroupItem) => boolean>,
      default: undefined,
    },
    sessions: {
      type: Array as PropType<SessionMeta[]>,
      default: () => [],
    },
    activeSessionId: {
      type: String as PropType<string | null>,
      default: null,
    },
    isSessionLoading: {
      type: Boolean,
      default: false,
    },
    isHydrating: {
      type: Boolean,
      default: false,
    },
    loadError: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'send',
    'abort',
    'selectModel',
    'acceptBatch',
    'rejectBatch',
    'retry',
    'reapplyItem',
    'reapplyGroup',
    'reapplyBatch',
    'switchSession',
    'createSession',
    'deleteSession',
    'renameSession',
    'retryLoad',
  ],
  setup(props, { emit }) {
    const store = useAgentStore()
    const bubbles = useAgentStoreSelector(agentStoreSelectors.bubbles)
    const status = useAgentStoreSelector(agentStoreSelectors.status)
    const reviewState = useAgentStoreSelector(agentStoreSelectors.reviewState)

    const isRunning = computed(
      () => status.value !== 'idle' && status.value !== 'done',
    )
    const hasModel = computed(() => props.selectedModel !== null)

    function getBatch(batchId: string): ReviewBatch | undefined {
      return reviewState.value?.batches.find(
        (b: ReviewBatch) => b.id === batchId,
      )
    }

    function handleSend(message: string) {
      store.getState().addBubble({ type: 'user', content: message })
      emit('send', message)
    }

    return () => (
      <div class="flex h-full min-h-0 flex-col overflow-hidden text-sm">
        <SessionHeader
          sessions={props.sessions}
          activeSessionId={props.activeSessionId}
          isLoading={props.isSessionLoading}
          loadError={props.loadError}
          onSwitchSession={(id: string) => emit('switchSession', id)}
          onCreateSession={() => emit('createSession')}
          onDeleteSession={(id: string) => emit('deleteSession', id)}
          onRenameSession={(id: string, title: string) =>
            emit('renameSession', id, title)
          }
          onRetry={() => emit('retryLoad')}
        />
        {props.isHydrating ? (
          <div class="flex flex-1 items-center justify-center">
            <NSpin size="small" />
          </div>
        ) : (
          <>
            <ChatMessageList
              bubbles={bubbles.value}
              getBatch={getBatch}
              replayState={props.replayState}
              isReplayableItem={props.isReplayableItem}
              onAcceptBatch={(id: string) => emit('acceptBatch', id)}
              onRejectBatch={(id: string) => emit('rejectBatch', id)}
              onReapplyItem={(itemId: string, item: ToolCallGroupItem) =>
                emit('reapplyItem', itemId, item)
              }
              onReapplyGroup={(groupId: string, items: ToolCallGroupItem[]) =>
                emit('reapplyGroup', groupId, items)
              }
              onReapplyBatch={(batchId: string) => emit('reapplyBatch', batchId)}
              onRetry={() => emit('retry')}
            />
            <ChatInput
              disabled={!hasModel.value}
              isRunning={isRunning.value}
              status={status.value}
              onSend={handleSend}
              onAbort={() => emit('abort')}
            >
              {{
                modelSelector: () => (
                  <ModelSelector
                    providerGroups={props.providerGroups}
                    selectedModel={props.selectedModel}
                    onSelectModel={(model: SelectedModel) =>
                      emit('selectModel', model)
                    }
                  />
                ),
              }}
            </ChatInput>
          </>
        )}
      </div>
    )
  },
})
```

**Verify:** `npx tsc --noEmit` — expect no errors.

**Commit:** `git commit -m "feat(agent-chat): integrate SessionHeader into AgentChatPanel with loadError"`

---

### Task 14: Frontend — Wire `useSessionManager` into `RichEditorWithAgent` with real abort

**Files:**
- Modify: `src/components/editor/rich/RichEditorWithAgent.tsx`

- [ ] **Step 1: Replace the `useConversationSync` import with `useSessionManager`**

Remove line:
```typescript
import { useConversationSync } from './agent-chat/composables/use-conversation-sync'
```

Add:
```typescript
import { useSessionManager } from './agent-chat/composables/use-session-manager'
```

Also add the `Ref` type import (update the Vue import):

```typescript
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  Teleport,
  toRef,
  watch,
} from 'vue'
import type { Ref } from 'vue'
```

- [ ] **Step 2: Create the real abort function that calls `agentLoop.abort()`**

After the `useAgentSetup` call and `provideAgentStore(store)` (line 277), add:

```typescript
    function realAbort() {
      if (agentLoop) {
        agentLoop.abort()
      }
      abort()
    }
```

This ensures the actual SSE transport abort from `@haklex/rich-ext-ai-agent`'s `useAgentLoop` is called, not just the local `abortController` which is disconnected from the real transport.

- [ ] **Step 3: Replace the `useConversationSync` call with `useSessionManager`**

Remove the `useConversationSync({ ... })` block (lines 289-295) and replace with:

```typescript
    const sessionManager = useSessionManager({
      store,
      refId: toRef(props, 'refId') as Ref<string | undefined>,
      refType: props.refType ?? 'post',
      getModel: () => props.selectedModel?.modelId ?? '',
      getProviderId: () => props.selectedModel?.providerId ?? '',
      abortFn: realAbort,
    })
```

- [ ] **Step 4: Update `handleAbort` to use `realAbort`**

Replace the existing `handleAbort`:

```typescript
    const handleAbort = () => realAbort()
```

- [ ] **Step 5: Pass session props to `AgentChatPanel` in the render function**

Update the `<AgentChatPanel>` JSX in the render function to include session props:

```tsx
            <AgentChatPanel
              providerGroups={props.providerGroups ?? []}
              selectedModel={props.selectedModel ?? null}
              replayState={reapply.state}
              isReplayableItem={reapply.isReplayableItem}
              sessions={sessionManager.sessions.value}
              activeSessionId={sessionManager.activeSessionId.value}
              isSessionLoading={sessionManager.isLoading.value}
              isHydrating={sessionManager.isHydrating.value}
              loadError={sessionManager.loadError.value}
              onSend={handleSend}
              onAbort={handleAbort}
              onRetry={handleRetry}
              onAcceptBatch={handleAcceptBatch}
              onRejectBatch={handleRejectBatch}
              onReapplyItem={(_itemId: string, item: any) =>
                reapply.applyReplayItem(item)
              }
              onReapplyGroup={(groupId: string, items: any[]) =>
                reapply.applyReplayGroup(groupId, items)
              }
              onReapplyBatch={(batchId: string) =>
                reapply.applyReplayBatch(batchId)
              }
              onSelectModel={(model: SelectedModel) =>
                props.onSelectModel?.(model)
              }
              onSwitchSession={(id: string) =>
                sessionManager.switchSession(id)
              }
              onCreateSession={() => sessionManager.createSession()}
              onDeleteSession={(id: string) =>
                sessionManager.deleteSession(id)
              }
              onRenameSession={(id: string, title: string) =>
                sessionManager.renameSession(id, title)
              }
              onRetryLoad={() => sessionManager.loadSessions()}
            />
```

**Verify:** `npx tsc --noEmit` — expect no errors.

**Commit:** `git commit -m "feat(agent-chat): wire useSessionManager into RichEditorWithAgent with real abort"`

---

### Task 15: Frontend — Delete `use-conversation-sync.ts`

**Files:**
- Delete: `src/components/editor/rich/agent-chat/composables/use-conversation-sync.ts`

- [ ] **Step 1: Delete the file**

```bash
rm src/components/editor/rich/agent-chat/composables/use-conversation-sync.ts
```

- [ ] **Step 2: Search for any remaining imports and remove them**

Verify no other files reference `use-conversation-sync`:

```bash
cd /Users/innei/git/innei-repo/admin-vue3 && rg 'use-conversation-sync' --type ts --type tsx
```

Expected: no results (the only import was in `RichEditorWithAgent.tsx`, already removed in Task 14).

**Verify:** `npx tsc --noEmit` — expect no errors.

**Commit:** `git commit -m "refactor(agent-chat): remove deprecated use-conversation-sync"`

---

### Task 16: Final type-check and validation

- [ ] **Step 1: Run full type check on admin-vue3**

```bash
cd /Users/innei/git/innei-repo/admin-vue3 && npx tsc --noEmit
```

Expected: clean output with zero errors.

- [ ] **Step 2: Run lint**

```bash
cd /Users/innei/git/innei-repo/admin-vue3 && pnpm lint
```

Fix any lint errors if found.

- [ ] **Step 3: Verify backend compiles**

```bash
cd /Users/innei/git/innei-repo/mx-core && npx tsc --noEmit
```

Expected: clean output.

**Commit (if lint fixes needed):** `git commit -m "chore: fix lint issues from session history feature"`

---

## Critical Issues Addressed

| # | Issue | Root Cause | Fix |
|---|-------|-----------|-----|
| 1 | **Abort path is a no-op** | `useAgentSetup().abort()` only sets status to idle via a disconnected `abortController`; the real abort is `agentLoop.abort()` from `useAgentLoop()` in the React component | Task 14 Step 2: `realAbort()` calls `agentLoop.abort()` (captured via `handleAgentLoopReady`), then falls through to the local `abort()`. Session manager receives `abortFn: realAbort` instead of the broken `abort`. |
| 2 | **Append-only sync misses in-place mutations** | `@haklex/rich-agent-core` mutates bubbles via `updateLastBubble`, `updateToolCallItem`, `store.setState({ bubbles })` — `slice(lastSyncedLength)` misses these | Task 2 Step 1: `ReplaceMessagesSchema` + DTO. Task 3 Step 5: `replaceMessages` service. Task 4 Step 3: `PUT /conversations/:id/messages` endpoint. Task 5: `replaceMessages` API client. Task 10: subscription uses debounced full replacement via `PUT` instead of append-only. |
| 3 | **Debounced sync not session-scoped** | Timer fires after session switch, writing old state to new session | Task 10 Step 1: `scheduleSyncMessages` captures `activeSessionId` at schedule time; `flushPendingSync()` called in `switchSession`, `deleteSession`, `createSession`, `onUnmounted`, and `refId` watcher. |

## Warnings Addressed

| # | Warning | Fix |
|---|---------|-----|
| 4 | **`messageCount` not available in list** | Task 1: `messageCount` stored field on model. Task 3 Steps 2/4/5: maintained on `create`, `appendMessages` (`$inc`), `replaceMessages`. Task 5: `messageCount` in `AgentConversation` interface. Task 6: `toSessionMeta` reads `conv.messageCount`. |
| 5 | **AI title not visible after generation** | Task 10 Step 2: after lazy creation, `setTimeout(() => loadSessions(), 5000)` picks up the server-generated title. |
| 6 | **`refId` watcher incomplete** | Task 11: watcher checks `newId !== oldId`; when `oldId` exists (value→different value), does full reset: `flushPendingSync`, clear `sessions`, `activeSessionId`, `isPendingCreation`, `store.getState().reset()`, increment `sessionEpoch`. |
| 7 | **Error states missing** | Task 7: `loadError: Ref<boolean>` in session manager. Task 12: `SessionHeader` shows "加载失败，点击重试" when `loadError` is true with `RefreshCw` icon. Task 7: hydration failure shows toast via `useMessage()` from Naive UI. |
| 8 | **Lazy create with first message** | Task 10 Step 2: subscription creates with `messages: currentBubbles` (the full bubbles array at creation time) instead of creating empty then appending. Matches spec requirement: "POST should include the first message". |

## Spec Coverage Checklist

| Requirement | Task(s) |
|------------|---------|
| Multiple independent sessions per article | Tasks 6-11 (session manager), Task 12 (session list UI) |
| Historical session can be continued | Task 7 (`switchSession` hydration) |
| Full restore — messages + reviewState + diffState | Task 1 (schema), Task 7 (hydration), Task 10 (sync) |
| Header bar with dropdown session switcher | Task 12 (SessionHeader), Task 13 (AgentChatPanel integration) |
| Restore most recent session on open | Task 7 (`loadSessions` → `switchSession(list[0].id)`) |
| Manual "+" to create new | Task 8 (`createSession`), Task 12 (Plus button) |
| AI-generated session titles | Task 3 Step 7 (`generateTitle` in `appendMessages`) |
| User can manually edit titles | Task 9 (`renameSession`), Task 12 (double-click inline edit) |
| Sessions can be deleted | Task 8 (`deleteSession`), Task 12 (trash + popconfirm) |
| PATCH endpoint for metadata | Task 2 (schema), Task 3 Step 6 (service), Task 4 Step 2 (controller) |
| PUT endpoint for full message replacement | Task 2 (schema), Task 3 Step 5 (service), Task 4 Step 3 (controller) |
| Frontend API client update | Task 5 |
| Lazy session creation with first message | Task 10 Step 2 (subscription creates on first message with messages included) |
| refId watch for new articles + full reset on change | Task 11 (refId watcher with old→new reset) |
| Sync guards (isHydrating, sessionEpoch) | Tasks 7, 10 |
| Session-scoped debounced full-replacement sync | Task 10 (`scheduleSyncMessages` + `flushPendingSync`) |
| Debounced reviewState/diffState sync | Task 10 (`scheduleDiffSync`) |
| Hydrating loading state | Task 13 (`isHydrating` → NSpin) |
| Error handling — silent sync failure | Task 10 (catch blocks on `replaceMessages` and `updateConversation`) |
| Error handling — load failure retry | Task 7 (`loadError`), Task 12 (retry UI) |
| Error handling — hydration failure toast | Task 7 (`message.error('会话恢复失败')`) |
| Delete active → switch to next | Task 8 (`deleteSession` logic) |
| Delete non-active → remove from list only | Task 8 |
| Dropdown sorted by updated desc | Task 12 (`sortedSessions` computed) |
| Empty state text | Task 12 ("暂无历史对话") |
| `messageCount` from backend | Task 1 (stored field), Task 3 (maintained), Task 5 (in API type), Task 6 (`toSessionMeta`) |
| Real abort via agentLoop.abort() | Task 14 (`realAbort` calls `agentLoop.abort()`) |
| Dark mode support via neutral palette | Task 12 (all classes use `neutral-*`, dark: variants) |
| `use-conversation-sync.ts` replaced | Task 14 (import swap), Task 15 (file delete) |
| Delayed title pickup after generation | Task 10 Step 2 (`setTimeout(() => loadSessions(), 5000)`) |
