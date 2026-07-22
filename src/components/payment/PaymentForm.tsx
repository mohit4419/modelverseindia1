import React, { useState } from 'react';
import { Loader2, DollarSign } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  onPaymentSubmit: (gateway: string) => void;
  isLoading?: boolean;
}

export default function PaymentForm({ amount, onPaymentSubmit, isLoading = false }: PaymentFormProps) {
  const [selectedGateway, setSelectedGateway] = useState('razorpay');

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 text-left space-y-4">
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">Transaction Value</h4>
        <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">₹{amount.toLocaleString('en-IN')}</p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Choose Secure Processor</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedGateway('razorpay')}
            className={`px-4 py-3 rounded-xl border text-xs font-bold uppercase transition cursor-pointer text-center ${
              selectedGateway === 'razorpay'
                ? 'border-purple-600 bg-purple-500/10 text-purple-700 dark:text-purple-400'
                : 'border-neutral-250 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500'
            }`}
          >
            Razorpay India
          </button>
          <button
            type="button"
            onClick={() => setSelectedGateway('stripe')}
            className={`px-4 py-3 rounded-xl border text-xs font-bold uppercase transition cursor-pointer text-center ${
              selectedGateway === 'stripe'
                ? 'border-purple-600 bg-purple-500/10 text-purple-700 dark:text-purple-400'
                : 'border-neutral-250 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500'
            }`}
          >
            Stripe Gateway
          </button>
        </div>
      </div>

      <button
        onClick={() => onPaymentSubmit(selectedGateway)}
        disabled={isLoading}
        className="w-full bg-[#EA3838] hover:bg-[#c02424] text-white py-3.5 px-6 rounded-full text-xs font-black uppercase tracking-widest shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <DollarSign className="h-4 w-4" />
        )}
        <span>Proceed to Pay</span>
      </button>
    </div>
  );
}
