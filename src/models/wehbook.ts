export interface WebhookModel {
  payloadUrl: string
  events: string[]
  enabled: boolean
  id: string
  secret: string
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
}
