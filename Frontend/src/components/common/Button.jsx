import React from 'react';
import { Link } from 'react-router-dom';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  className = '',
  onClick,
  href,
  to,
  ...props
}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const combinedClass = `btn ${variantClass} ${sizeClass} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={combinedClass} onClick={onClick} {...props}>
        {Icon && <Icon size={size === 'sm' ? 16 : 18} />}
        <span>{children}</span>
        {IconRight && <IconRight size={size === 'sm' ? 16 : 18} />}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedClass} onClick={onClick} {...props}>
        {Icon && <Icon size={size === 'sm' ? 16 : 18} />}
        <span>{children}</span>
        {IconRight && <IconRight size={size === 'sm' ? 16 : 18} />}
      </a>
    );
  }

  return (
    <button className={combinedClass} onClick={onClick} {...props}>
      {Icon && <Icon size={size === 'sm' ? 16 : 18} />}
      <span>{children}</span>
      {IconRight && <IconRight size={size === 'sm' ? 16 : 18} />}
    </button>
  );
}
