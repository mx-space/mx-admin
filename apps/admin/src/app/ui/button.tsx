import { Button as BaseButton } from '@base-ui/react/button'
import { Link } from 'react-router'
import type { ButtonProps as BaseButtonProps } from '@base-ui/react/button'
import type { LinkProps } from 'react-router'

import { cn } from './cn'

type ButtonVariant = 'primary' | 'subtle'

export interface ButtonProps extends Omit<BaseButtonProps, 'className'> {
  className?: string
  variant?: ButtonVariant
}

export interface ButtonLinkProps extends Omit<LinkProps, 'className'> {
  className?: string
  variant?: ButtonVariant
}

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    'bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200',
  subtle:
    'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900',
}

const buttonClassName =
  'inline-flex h-9 items-center justify-center gap-2 rounded px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary-shallow)] disabled:pointer-events-none disabled:opacity-50'

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={cn(buttonClassName, variantClassNames[variant], className)}
      {...props}
    />
  )
}

export function ButtonLink({
  className,
  variant = 'primary',
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonClassName, variantClassNames[variant], className)}
      {...props}
    />
  )
}
