interface MessageApiInjection {
  info: (content: string, options?: any) => any
  success: (content: string, options?: any) => any
  warning: (content: string, options?: any) => any
  error: (content: string, options?: any) => any
  loading: (content: string, options?: any) => any
}

declare interface Window {
  message: MessageApiInjection
}
