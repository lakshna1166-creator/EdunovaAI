import React from 'react';

export default function Badge({ children, icon: Icon, dot = true, className = '' }) {
  return (
    <div className={`badge-pill ${className}`}>
      {dot && <span className="badge-dot" />}
      {Icon && <Icon size={14} className="text-cyan-400" />}
      <span>{children}</span>
    </div>
  );
}
