import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit'
  title?: string
}

const variants = {
  primary: 'bg-gradient-to-r from-[#00E5FF] to-[#0088cc] text-[#080B10] font-semibold hover:shadow-[0_0_20px_rgba(0,229,255,0.35)] hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0',
  secondary: 'bg-transparent text-[#00E5FF] border border-[#00E5FF40] hover:bg-[#00E5FF10] hover:border-[#00E5FF] disabled:opacity-40 disabled:cursor-not-allowed',
  ghost: 'bg-transparent text-[#98A6B8] border border-transparent hover:bg-[#17212D] hover:text-[#F4F7FB] hover:border-[#263342] disabled:opacity-40 disabled:cursor-not-allowed',
  danger: 'bg-transparent text-[#FF5D73] border border-[#FF5D7340] hover:bg-[#FF5D7310] hover:border-[#FF5D73] disabled:opacity-40 disabled:cursor-not-allowed',
}
const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-2.5 text-sm rounded-lg gap-2',
}

export function Button({ children, className = '', onClick, disabled, variant = 'ghost', size = 'md', type = 'button', title }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center transition-all duration-150 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

