import type { Pager } from "./base";

export interface SubscribeResponse {
  data: SubscribeModel[]
  pagination: Pager
}


export interface SubscribeModel {
  id: string;
  email: string;
  cancel_token: string;
  subscribe: number;
  created: string;
}