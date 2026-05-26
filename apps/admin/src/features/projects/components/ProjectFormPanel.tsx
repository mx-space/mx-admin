import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Import as ImportIcon, Save, X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { GithubRepo } from '~/api/github-repo'
import type { ProjectModel } from '~/models/project'
import type { ProjectFormMode, ProjectFormState } from '../types/projects'

import { createProject, updateProject } from '~/api/projects'
import { Button } from '~/ui/button'
import { cn } from '~/ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/ui/layout'
import { Scroll } from '~/ui/scroll'
import { TextArea, TextInput } from '~/ui/text-field'

import { emptyProjectForm } from '../constants'
import {
  formToPayload,
  pickImagesFromMarkdown,
  projectToForm,
} from '../utils/projects'
import { GithubImportPanel } from './GithubImportPanel'
import { ImagePreview } from './ProjectImageGrid'

export function ProjectFormPanel(props: {
  mode: ProjectFormMode
  onCancel: () => void
  onMobileBack: () => void
  onSuccess: (project: ProjectModel) => Promise<void>
  project: ProjectModel | null
}) {
  const [form, setForm] = useState<ProjectFormState>(() =>
    props.project ? projectToForm(props.project) : emptyProjectForm,
  )
  const [githubImportOpen, setGithubImportOpen] = useState(false)
  const [error, setError] = useState('')
  const isEdit = props.mode === 'edit' && Boolean(props.project?.id)
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = formToPayload(form)

      if (props.project?.id) return updateProject(props.project.id, payload)

      return createProject(payload)
    },
    onSuccess: async (project) => {
      toast.success(isEdit ? '保存成功' : '创建成功')
      await props.onSuccess(project)
    },
  })

  useEffect(() => {
    setForm(props.project ? projectToForm(props.project) : emptyProjectForm)
    setError('')
  }, [props.project])

  const updateField = (key: keyof ProjectFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const applyGithubRepo = (repo: GithubRepo, readme: string | null) => {
    const images = pickImagesFromMarkdown(readme ?? '')

    setForm((current) => ({
      ...current,
      description: repo.description ?? '',
      images,
      imagesText: images.join('\n'),
      name: repo.name || current.name,
      previewUrl: repo.homepage ?? '',
      projectUrl: repo.html_url || current.projectUrl,
      text: readme ?? current.text,
    }))
    setGithubImportOpen(false)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('项目名称不能为空')
      return
    }
    if (!form.text.trim()) {
      setError('项目内容不能为空')
      return
    }

    setError('')
    mutation.mutate()
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Button
            aria-label="返回项目列表"
            className="h-8 px-2 lg:hidden"
            onClick={props.onMobileBack}
            type="button"
            variant="subtle"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Button>
          <h2 className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {isEdit ? '编辑项目' : '新建项目'}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            onClick={() => setGithubImportOpen((value) => !value)}
            type="button"
            variant="subtle"
          >
            <ImportIcon aria-hidden="true" className="size-4" />从 GitHub 获取
          </Button>
          <Button onClick={props.onCancel} type="button" variant="subtle">
            <X aria-hidden="true" className="size-4" />
            取消
          </Button>
          <Button
            disabled={mutation.isPending}
            form="project-form"
            type="submit"
          >
            <Save aria-hidden="true" className="size-4" />
            {isEdit ? '保存' : '创建'}
          </Button>
        </div>
      </div>

      <Scroll className="flex-1">
        <form id="project-form" onSubmit={handleSubmit}>
          <div className="mx-auto grid max-w-3xl gap-4 p-6">
            {githubImportOpen ? (
              <GithubImportPanel
                defaultValue={form.projectUrl}
                onApply={applyGithubRepo}
              />
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="项目名称"
                onChange={(value) => updateField('name', value)}
                required
                value={form.name}
              />
              <TextInput
                label="头像 URL"
                onChange={(value) => updateField('avatar', value)}
                value={form.avatar ?? ''}
              />
            </div>
            <TextInput
              label="描述"
              onChange={(value) => updateField('description', value)}
              value={form.description}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput
                label="项目 URL"
                onChange={(value) => updateField('projectUrl', value)}
                value={form.projectUrl ?? ''}
              />
              <TextInput
                label="预览 URL"
                onChange={(value) => updateField('previewUrl', value)}
                value={form.previewUrl ?? ''}
              />
              <TextInput
                label="文档 URL"
                onChange={(value) => updateField('docUrl', value)}
                value={form.docUrl ?? ''}
              />
            </div>
            <TextArea
              controlClassName="min-h-20"
              label="图片 URL"
              onChange={(value) => updateField('imagesText', value)}
              placeholder="一行一个图片 URL"
              value={form.imagesText}
            />
            <ImagePreview imagesText={form.imagesText} />
            <TextArea
              controlClassName="min-h-72 font-mono"
              label="内容"
              onChange={(value) => updateField('text', value)}
              required
              value={form.text}
            />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
          </div>
        </form>
      </Scroll>
    </section>
  )
}
