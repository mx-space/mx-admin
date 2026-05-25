import type { ModalInstance } from './types'

type Listener = () => void

let stack: ModalInstance[] = []
const listeners = new Set<Listener>()

function emit() {
  for (const l of listeners) l()
}

export const modalStore = {
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot(): ModalInstance[] {
    return stack
  },
  push(inst: ModalInstance) {
    stack = [...stack, inst]
    emit()
  },
  update(id: string, patch: Partial<ModalInstance>) {
    let changed = false
    const next = stack.map((inst) => {
      if (inst.id !== id) return inst
      changed = true
      return { ...inst, ...patch }
    })
    if (changed) {
      stack = next
      emit()
    }
  },
  patchProps(id: string, propsPatch: Record<string, unknown>) {
    let changed = false
    const next = stack.map((inst) => {
      if (inst.id !== id) return inst
      changed = true
      return { ...inst, props: { ...(inst.props as object), ...propsPatch } }
    })
    if (changed) {
      stack = next
      emit()
    }
  },
  remove(id: string) {
    const next = stack.filter((inst) => inst.id !== id)
    if (next.length !== stack.length) {
      stack = next
      emit()
    }
  },
  find(id: string): ModalInstance | undefined {
    return stack.find((inst) => inst.id === id)
  },
}
