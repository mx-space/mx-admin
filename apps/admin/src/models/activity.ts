export interface ActivityReadDurationType {
  id: string
  type: number
  payload: RoomPayload
  created: string
  refId: string
}
export interface RoomPayload {
  connectedAt: number
  operationTime: number
  updatedAt: number
  position: number
  roomName: string
  ip: string
  joinedAt?: number
  displayName?: string
  identity: string
}
