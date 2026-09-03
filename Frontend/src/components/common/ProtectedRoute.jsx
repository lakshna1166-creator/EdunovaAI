import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          gap: '16px',
          color: '#2563EB'
        }}
      >
        <Loader2 size={36} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748B', fontSize: '0.95rem', fontWeight: 600 }}>
          Loading EduNovaAI...
        </p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and preserve destination for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
