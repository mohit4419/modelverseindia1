import React from 'react';
import BecomeModelForm from '../../components/profile/BecomeModelForm';
import { useModels } from '../../hooks/useModels';
import { useAuth } from '../../hooks/useAuth';

import { dbService } from '../../services/db';

export default function BecomeModelIndex() {
  const { models, handleModelRegisterSubmit } = useModels();
  const { clientId, userEmail } = useAuth();
  const currentUser = dbService.getCurrentSessionUser();

  const existingModel = models.find(m => 
    (clientId && m.userId === clientId) || 
    (currentUser?.id && m.userId === currentUser.id) || 
    (userEmail && m.email && m.email.toLowerCase() === userEmail.toLowerCase())
  );

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
