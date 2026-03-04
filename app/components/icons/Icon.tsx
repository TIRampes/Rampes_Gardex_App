'use client';

import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

export type IconName = keyof typeof Icons;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export const Icon = ({ name, size = 20, className }: IconProps) => {
  const LucideIcon = Icons[name] as React.ElementType;
  if (!LucideIcon) {
    console.warn(`Icone "${name}" non trouvée`);
    return null;
  }
  return <LucideIcon size={size} className={cn('shrink-0', className)} />;
};