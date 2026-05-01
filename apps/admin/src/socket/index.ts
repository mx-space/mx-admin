import { SocketClient } from './socket-client'

const client = new SocketClient()
window.socket = client
export { client as socket }
