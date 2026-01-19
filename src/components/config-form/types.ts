export type UIComponent =
  | 'input'
  | 'password'
  | 'textarea'
  | 'number'
  | 'switch'
  | 'select'
  | 'tags'

export interface UIConfig {
  component: UIComponent
  halfGrid?: boolean
  hidden?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: string | number }>
}

export interface FormField {
  key: string
  title: string
  description?: string
  required?: boolean
  ui: UIConfig
  fields?: FormField[]
}

export interface FormSection {
  key: string
  title: string
  description?: string
  hidden?: boolean
  fields: FormField[]
}

export interface FormGroup {
  key: string
  title: string
  description: string
  icon: string
  sections: FormSection[]
}

export interface FormDSL {
  title: string
  description?: string
  groups: FormGroup[]
  defaults: Record<string, any>
}
