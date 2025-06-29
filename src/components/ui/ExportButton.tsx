import React from 'react';
import { Download } from 'lucide-react';
import { Button, ButtonProps } from './Button';

interface ExportButtonProps extends Omit<ButtonProps, 'icon'> {
  onClick: () => void;
  label?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onClick,
  label = 'Export',
  variant = 'ghost',
  size = 'sm',
  className = '',
  ...props
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      icon={Download}
      onClick={onClick}
      className={className}
      {...props}
    >
      {label}
    </Button>
  );
};