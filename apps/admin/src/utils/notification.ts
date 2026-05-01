export class BrowserNotification {
  constructor() {
    this.initNotice()
  }

  initNotice(): Promise<boolean> {
    return new Promise((r, j) => {
      if (!('Notification' in window)) {
        j(new Error('浏览器不支持发送通知'))
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((p) =>
          p === 'granted' ? r(true) : j(new Error('已拒绝通知')),
        )
      } else if (Notification.permission === 'denied') {
        return j(new Error('已拒绝通知'))
      } else {
        j(true)
      }
    })
  }

  notice(
    title: string,
    body: string,
    options: Omit<NotificationOptions, 'body'> = {},
  ): Promise<Notification | undefined> {
    return new Promise((r) => {
      this.initNotice().then((b) => {
        if (b && !document.hasFocus()) {
          const notification = new Notification(title, { body, ...options })
          r(notification)
        }
      })
    })
  }
}
