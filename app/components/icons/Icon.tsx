'use client';

import { Edit, X, List, Users, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconProps {
  name: 'edit' | 'x' | 'list' | 'users' | 'plus';
  size?: number;
  className?: string;
}

export const Icon = ({ name, size = 20, className }: IconProps) => {
  let Component;
  switch (name) {
    case 'edit':
      Component = Edit;
      break;
    case 'x':
      Component = X;
      break;
    case 'list':
      Component = List;
      break;
    case 'users':
      Component = Users;
      break;
    case 'plus':
      Component = Plus;
      break;
    default:
      console.warn(`Icône "${name}" non trouvée`);
      return null;
  }

  return <Component size={size} className={cn('shrink-0', className)} />;
};