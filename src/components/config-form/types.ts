export type UIComponent =
  | 'input'
  | 'password'
  | 'textarea'
  | 'number'
  | 'switch'
  | 'select'
  | 'tags'
  | 'action'

export interface UIConfig {
  component: UIComponent
  halfGrid?: boolean
  hidden?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: string | number }>
  /**
   * Conditionally show this field based on sibling field values.
   * When the condition is not met, the field and all its nested children are hidden.
   */
  showWhen?: Record<string, string | string[]>
  /**
   * Action button configuration (only used when component is 'action')
   */
  actionId?: string
  actionLabel?: string
  actionVariant?:
    | 'default'
    | 'primary'
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
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
