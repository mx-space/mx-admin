import { CodeEditor } from '~/ui/primitives/code-editor'

export function TemplateCodeEditor(props: {
  dirty: boolean
  onChange: (value: string) => void
  onSave: () => void
  saving: boolean
  value: string
}) {
  return (
    <CodeEditor
      dirty={props.dirty}
      language="html"
      onChange={props.onChange}
      onSave={props.onSave}
      saving={props.saving}
      title="html / ejs"
      value={props.value}
    />
  )
}
