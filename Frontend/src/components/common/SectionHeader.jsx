import React from 'react';
import Badge from './Badge';

export default function SectionHeader({
  badgeText,
  badgeIcon,
  title,
  highlightText,
  description,
  align = 'center',
  className = ''
}) {
  return (
    <div
      className={`section-header ${className}`}
      style={{ textAlign: align, margin: align === 'left' ? '0 0 40px 0' : '0 auto 60px auto' }}
    >
      {badgeText && (
        <div className="section-badge">
          <Badge icon={badgeIcon}>{badgeText}</Badge>
        </div>
      )}
      <h2>
        {title}{' '}
        {highlightText && <span className="gradient-text-brand">{highlightText}</span>}
      </h2>
      {description && <p>{description}</p>}
    </div>
  );
}
