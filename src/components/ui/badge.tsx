import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-[#0F766E] text-white',
        secondary: 'bg-[#CCFBF1] text-[#0F766E]',
        success: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]',
        danger: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]',
        accent: 'bg-[#FFEDD5] text-[#F97316] border border-[#FED7AA]',
        muted: 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]',
        outline: 'border border-[#E2E8F0] text-[#1E293B]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
