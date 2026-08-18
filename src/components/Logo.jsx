import React from 'react';
import { HeartPulse } from 'lucide-react';

export default function Logo({ subtitle }) {
  return (
    <div className="brand-header">
      <div className="logo-badge">
        <div className="logo-icon-wrapper">
          <HeartPulse size={18} strokeWidth={2.5} />
        </div>
        <span className="logo-text">Nutricionistas-SOS</span>
      </div>
      {subtitle && <p className="brand-subtitle">{subtitle}</p>}
    </div>
  );
}
