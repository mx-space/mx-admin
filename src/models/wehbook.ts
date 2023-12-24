export interface WebhookModel {
  payloadUrl: string
  events: string[]
  enabled: boolean
  id: string
  secret: string

  scope: number
}

type JSON = string
export declare class WebhookEventModel {
  headers: JSON
  payload: JSON
  event: string
  response: JSON
  success: boolean
  hookId: Ref<WebhookModel>
  status: number
  id: string
  timestamp: string
}

export const EventScope = {
  TO_VISITOR: 1 << 0,
  TO_ADMIN: 1 << 1,
  TO_SYSTEM: 1 << 2,
  // TO_VISITOR_ADMIN: (1 << 0) | (1 << 1),
  // TO_SYSTEM_VISITOR: (1 << 0) | (1 << 2),
  // TO_SYSTEM_ADMIN: (1 << 1) | (1 << 2),
  ALL: (1 << 0) | (1 << 1) | (1 << 2),
}
