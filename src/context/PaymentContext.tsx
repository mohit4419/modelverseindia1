import React, { createContext, useContext, useState } from 'react';
import { paymentService } from '../services/payment.service';

interface PaymentContextType {
  paymentHistory: any[];
  addPaymentRecord: (record: any) => void;
  isSandboxActive: boolean;
  toggleSandbox: () => void;
  createSession: (payload: any) => Promise<any>;
  verifyPayment: (payload: any) => Promise<any>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isSandboxActive, setIsSandboxActive] = useState(true);

  const addPaymentRecord = (record: any) => {
    setPaymentHistory((prev) => [record, ...prev]);
  };

  const toggleSandbox = () => {
    setIsSandboxActive((prev) => !prev);
  };

  const createSession = async (payload: any) => {
    return paymentService.createSession(payload);
  };

  const verifyPayment = async (payload: any) => {
    return paymentService.verifyPayment(payload);
  };

  return (
    <PaymentContext.Provider value={{ paymentHistory, addPaymentRecord, isSandboxActive, toggleSandbox, createSession, verifyPayment }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayments() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayments must be used within a PaymentProvider');
  }
  return context;
}
