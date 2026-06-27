import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold transition-opacity disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
  {
    variants: {
      variant: {
        default:  'bg-plum text-white shadow-[0_5px_16px_rgba(110,27,58,0.26)]',
        soft:     'bg-plum-soft text-plum',
        outline:  'bg-transparent border border-line text-ink',
        ghost:    'bg-transparent text-muted',
        success:  'bg-success-bg text-success',
        warning:  'bg-draft-bg text-draft border border-[rgba(181,118,42,0.3)]',
      },
      size: {
        sm:   'h-[34px] px-[13px] rounded-[10px] text-[12px]',
        md:   'h-[38px] px-[16px] rounded-[11px] text-[12.5px]',
        lg:   'h-[44px] px-[16px] rounded-[13px] text-[13.5px]',
        xl:   'h-[46px] px-[18px] rounded-[14px] text-[13.5px]',
        icon: 'h-[38px] w-[38px] rounded-[12px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
