import { bus } from 'utils/event-bus'
import { createApp } from 'vue'
import App from './App'
import './index.css'
import { router } from './router'

const app = createApp(App)

app.use(router)
app.mount('#app')

if (__DEV__) {
  window.app = app
  window.bus = bus
}
