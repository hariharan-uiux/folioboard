import React from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';

export interface DuotoneIconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon;
  fillColor?: string;
  fillOpacity?: number;
}

export const DuotoneIcon: React.FC<DuotoneIconProps> = ({
  icon: Icon,
  fillColor = 'currentColor',
  fillOpacity = 0.22,
  className = '',
  strokeWidth = 1.8,
  ...props
}) => {
  return (
    <Icon
      className={`shrink-0 ${className}`}
      fill={fillColor}
      fillOpacity={fillOpacity}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
};

export default DuotoneIcon;
