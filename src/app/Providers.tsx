import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { BookingProvider } from '../context/BookingContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <AppProvider>
        <BookingProvider>
          {children}
        </BookingProvider>
      </AppProvider>
    </AuthProvider>
  );
}
