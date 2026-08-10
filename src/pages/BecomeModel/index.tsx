import React from 'react';
import BecomeModelForm from '../../components/profile/BecomeModelForm';
import { useModels } from '../../hooks/useModels';
import { useAuth } from '../../hooks/useAuth';

import { dbService } from '../../services/db';

export default function BecomeModelIndex() {
  const { models, handleModelRegisterSubmit } = useModels();
  const { clientId, userEmail } = useAuth();
  const currentUser = dbService.getCurrentSessionUser();

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isEditMode = searchParams?.get('edit') === 'true' || Boolean(searchParams?.get('id'));
  const editModelId = searchParams?.get('id');

  const existingModel = isEditMode
    ? models.find(m => 
        (editModelId && m.id === editModelId) ||
        (clientId && m.userId === clientId) || 
        (currentUser?.id && m.userId === currentUser.id) || 
        (userEmail && m.email && m.email.toLowerCase() === userEmail.toLowerCase())
      )
    : undefined;

  return (
    <div className="py-10 max-w-4xl mx-auto px-4">
      <BecomeModelForm
        userId={clientId}
        initialModel={existingModel}
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
