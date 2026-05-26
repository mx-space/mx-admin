import { KeyRound, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '~/ui/button'
import { AppPage, PageHeader } from '~/ui/page-layout'
import { Panel } from '~/ui/panel'
import { Scroll } from '~/ui/scroll'
import { authClient } from '~/utils/authjs/auth'

export function AuthnDebugRouteViewContent() {
  return (
    <AppPage>
      <PageHeader
        description="Passkey registration and authentication checks."
        title="Passkey Diagnostics"
      />
      <Scroll
        className="min-h-0 flex-1"
        innerClassName="mx-auto w-full max-w-3xl p-4"
      >
        <Panel
          description="Passkey registration and authentication checks using the React runtime."
          title="Passkey diagnostics"
        >
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <DiagnosticAction
              description="Creates a random test passkey name and sends it to Better Auth."
              icon={KeyRound}
              label="Register"
              onClick={registerPasskey}
            />
            <DiagnosticAction
              description="Runs the browser passkey authentication flow for the current user."
              icon={ShieldCheck}
              label="Authenticator"
              onClick={authenticatePasskey}
            />
          </div>
        </Panel>
      </Scroll>
    </AppPage>
  )
}

interface DiagnosticActionProps {
  description: string
  icon: typeof KeyRound
  label: string
  onClick: () => Promise<void>
}

function DiagnosticAction(props: DiagnosticActionProps) {
  const Icon = props.icon

  return (
    <section className="rounded border border-neutral-200 p-4 dark:border-neutral-800">
      <Icon
        aria-hidden="true"
        className="mb-4 size-5 text-[var(--color-primary)]"
      />
      <h3 className="text-sm font-medium">{props.label}</h3>
      <p className="mb-4 mt-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
        {props.description}
      </p>
      <Button onClick={props.onClick} type="button" variant="subtle">
        {props.label}
      </Button>
    </section>
  )
}

async function registerPasskey() {
  try {
    const name = `test-${Math.trunc(Math.random() * 100)}`
    const result = await authClient.passkey.addPasskey({ name })

    if (result.error) {
      toast.error(result.error.message || '注册失败')
    } else {
      toast.success('Passkey 注册成功')
    }
  } catch (error) {
    if (isNamedError(error, 'InvalidStateError')) {
      toast.error('该 Passkey 已经注册过了')
    } else {
      toast.error(readErrorMessage(error, '注册失败'))
    }
  }
}

async function authenticatePasskey() {
  try {
    const result = await authClient.signIn.passkey()

    if (result.error) {
      toast.error(result.error.message || '认证失败')
    } else {
      toast.success('Passkey 认证成功')
    }
  } catch (error) {
    toast.error(readErrorMessage(error, '认证失败'))
  }
}

function isNamedError(error: unknown, name: string) {
  return error instanceof Error && error.name === name
}

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message || fallback : fallback
}
