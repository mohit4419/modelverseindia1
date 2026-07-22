import React from 'react';
import AuthView from '../../components/common/AuthView';
import { useAuth } from '../../context/AuthContext';

export default function RegisterIndex() {
  const { handleAuthSuccess } = useAuth();

  return (
    <div className="py-12 max-w-lg mx-auto">
      <AuthView
        initialTab="signup"
        onAuthSuccess={handleAuthSuccess}
        onCancel={() => { window.location.href = '/'; }}
      />
    </div>
  );
}
