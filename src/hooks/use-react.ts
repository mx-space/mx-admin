import {
  onMounted,
  onUnmounted,
  onUpdated,
  reactive,
  ref,
  Ref,
  toRaw,
  watch,
  WatchStopHandle,
} from 'vue'
// eg, useEffect(() =>{}, [a,b])
export const useEffect = (
  fn: () => (() => void) | undefined | void,
  deps?: any[],
) => {
  const unmountedFn = ref<Function>()

  const callFn = () => {
    const uFn = fn()
    if (uFn && typeof uFn == 'function') {
      unmountedFn.value = uFn
    }
  }
  onMounted(() => {
    callFn()
  })
  let depsWatcher = [] as WatchStopHandle[]

  onUnmounted(() => {
    if (unmountedFn.value && typeof unmountedFn.value == 'function') {
      unmountedFn.value()
    }

    for (const w of depsWatcher) {
      w()
    }
  })

  if (deps) {
    if (!Array.isArray(deps)) {
      throw new TypeError('deps must be array')
    } else {
      for (const [index, d] of Object.entries(deps)) {
        const watcher = watch(
          () => d,
          (n, p, cleanup) => {
            if (depsWatcher[index]) {
              depsWatcher[index]()
            }
            callFn()
            cleanup(callFn)
          },
          { deep: true },
        )

        depsWatcher.push(watcher)
      }
    }
  } else {
    onUpdated(() => {
      callFn()
    })
  }
}
const isObject = (o: any): o is object => {
  return typeof o === 'object' && typeof o !== 'function' && o !== null
}

const isFunction = (f: any): f is Function => {
  return typeof f === 'function'
}
/// eg const [c, setC] =  useState(1); setC(prev => prev++)
// const reactiveStateMap = reactive<Record<any, any>>({})
export const useState = <T>(defaultValue: T) => {
  const state = ref(defaultValue) as Ref<T>
  const set = (value: T | ((prevValue: T) => T)): void => {
    if (isFunction(value)) {
      const after = value(toRaw(state.value as T))
      state.value = after
    } else {
      state.value = value
    }
  }

  return [state, set] as const
}

const useStateObj = <O extends object>(defaultObj: O) => {
  const obj = reactive(defaultObj)
  const set = (valueObj: O): void => {
    Object.entries(valueObj).forEach(([key, val]) => {
      obj[key] = val
    })
  }
  return [obj, set]
}
