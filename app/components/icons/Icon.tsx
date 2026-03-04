import { icons } from 'lucide-react'
import { cn } from '@/lib/utils'

export type IconName = keyof typeof icons

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, className }) => {
  const LucideIcon = icons[name] as React.ElementType
  return <LucideIcon size={size} className={cn('shrink-0', className)} />
}