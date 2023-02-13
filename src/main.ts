import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

import 'reflect-metadata'

import { piniaStore } from 'stores'
import { bus } from 'utils/event-bus'

import 'virtual:windi.css'

import { createApp } from 'vue'

import App from './App'

import './index.css'

import { router } from './router'

const app = createApp(App)

app.use(router)
app.use(piniaStore)
app.mount('#app')

if (__DEV__) {
  window.app = app
  window.bus = bus
}

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  },
}

// cjs webpack compatibility
// @ts-ignore
window.module = {}
window.module.exports = {}
window.global = window
window.os = {
  homedir() {
    return ''
  },
}
declare global {
  interface JSON {
    safeParse: typeof JSON.parse
  }
}
JSON.safeParse = (...rest) => {
  try {
    return JSON.parse(...rest)
  } catch (error) {
    return null
  }
}
