import { request } from '~/utils/request'

export interface ServerlessFunctionData {
  function: string
}

export const debugApi = {
  // 执行 Serverless 函数
  executeFunction: (data: ServerlessFunctionData) =>
    request.post<any>('/debug/function', { data }),
}
