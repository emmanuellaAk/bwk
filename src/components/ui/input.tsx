import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full h-[42px] px-[12px] rounded-[11px] text-[13.5px] font-medium',
        'bg-surface-2 border border-line text-ink placeholder:text-muted',
        'focus:outline-none focus:border-plum focus:ring-1 focus:ring-plum/20',
        'transition-colors',
        className
      )}
      {...props}
    />
  )
}
