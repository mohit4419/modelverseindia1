import React from 'react';
import BecomeModelForm from '../../components/profile/BecomeModelForm';
import { useModels } from '../../hooks/useModels';
import { useAuth } from '../../hooks/useAuth';

export default function BecomeModelIndex() {
  const { handleModelRegisterSubmit } = useModels();
  const { clientId } = useAuth();

  return (
    <div className="py-10 max-w-4xl mx-auto px-4">
      <BecomeModelForm
        userId={clientId}
        onRegisterSubmit={async (newModel) => {
          await handleModelRegisterSubmit(newModel);
        }}
        onGoHome={() => {
          window.location.href = '/';
        }}
      />
    </div>
  );
}
