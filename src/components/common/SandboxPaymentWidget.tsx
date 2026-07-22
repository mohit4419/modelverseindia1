/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  QrCode, 
  X, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  ClipboardCheck, 
  ArrowRight, 
  Activity, 
  Coins,
  ShieldCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Confetti from 'react-confetti';
import { PaymentRecord } from '../../types';

interface SandboxPaymentWidgetProps {
  onAddPaymentRecord: (payment: PaymentRecord) => void;
  clientId: string;
  userEmail: string;
}

export default function SandboxPaymentWidget({ onAddPaymentRecord, clientId, userEmail }: SandboxPaymentWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [utr, setUtr] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedInvoice, setGeneratedInvoice] = useState('');

  const upiId = 'mohit44190ssr@okhdfcbank';
  const payDescription = 'ModelVerse India Sandbox Gateway Check';
  const upiUri = `upi://pay?pa=${upiId}&pn=INDIAN%20POLITICS&am=1&cu=INR&tn=${encodeURIComponent(payDescription)}`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateSuccess = () => {
    setStatus('verifying');
    setErrorMessage('');
    
    setTimeout(() => {
      const invoiceId = `MVI-TEST-${Math.floor(Math.random() * 8000 + 1000)}`;
      setGeneratedInvoice(invoiceId);
      setStatus('success');

      // Create ₹1 Payment Record
      const testPayment: PaymentRecord = {
        id: `pay_test_${Date.now()}`,
        userId: clientId || 'anonymous_tester',
        userName: 'Gateway Sandbox Tester',
        userEmail: userEmail || 'tester@modelverse.in',
        amount: 1,
        paymentGateway: 'Razorpay',
        status: 'success',
        description: 'Gateway Checking & Charity Donation (₹1 Sandboxed Check)',
        createdAt: new Date().toISOString(),
        invoiceId: invoiceId,
        isSandbox: true
      };

      onAddPaymentRecord(testPayment);
    }, 1500);
  };

  const handleUpiVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr || utr.trim().length < 8) {
      setStatus('error');
      setErrorMessage('Please enter a valid Transaction UTR reference ID (typically 8-12 digits).');
      return;
    }
    simulateSuccess();
  };

  return (
    <>
      {/* Floating Side Button Pinned on Right Hand Edge */}
      <div className="fixed right-0 top-[35%] -translate-y-1/2 z-[100] flex flex-col items-end">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border border-neutral-800 dark:border-neutral-200 shadow-2xl pl-4 pr-3.5 py-3 rounded-l-full hover:translate-x-[-4px] transition duration-200 cursor-pointer flex items-center space-x-2 group shrink-0"
          title="Test ₹1 Payment Gateway connectivity"
        >
          <div className="relative">
            <Coins className="h-4 w-4 text-[#D4AF37] dark:text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
          </div>
          <div className="flex flex-col items-start leading-none text-left">
            <span className="text-[10px] uppercase font-black tracking-widest font-mono text-zinc-400 dark:text-zinc-600 group-hover:text-amber-500 transition">Sandbox</span>
            <span className="text-xs font-black tracking-wide">₹1 Check</span>
          </div>
        </button>
      </div>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-[110]"
            />

            {/* Slideout Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 h-screen w-full max-w-[380px] bg-white dark:bg-zinc-900 shadow-2xl border-l border-neutral-200 dark:border-neutral-800 z-[120] flex flex-col overflow-y-auto"
            >
              {/* Header */}
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-zinc-850">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <Activity className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">₹1 Gateway Checker</h3>
                    <p className="text-[9px] text-neutral-400 font-bold font-mono">Sandbox Test Node</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Main Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                {status !== 'success' ? (
                  <div className="space-y-6">
                    {/* Intro Alert Card */}
                    <div className="rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-2">
                      <div className="flex items-center space-x-1.5 text-blue-800 dark:text-blue-400 font-black text-[10px] uppercase tracking-wider font-mono">
                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                        <span>Verification Sandbox</span>
                      </div>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        Test live UPI/QR gateway compatibility with exactly <strong className="text-neutral-900 dark:text-white">₹1</strong>! 
                        This sandbox simulation is strictly for checking purposes and does not affect model profile unlocks.
                      </p>
                      <div className="flex items-center space-x-1 text-[9px] text-amber-700 dark:text-amber-400 font-bold font-mono pt-1">
                        <Heart className="h-3 w-3 fill-current" />
                        <span>Acts as a charity check for Indian Artistes.</span>
                      </div>
                    </div>

                    {/* QR Code Segment */}
                    <div className="flex flex-col items-center space-y-4">
                      <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-mono">Live UPI Scan Code</span>
                      
                      <div className="p-3 bg-white border border-neutral-150 rounded-2xl shadow-md relative">
                        <QRCodeSVG
                          value={upiUri}
                          size={155}
                          level="H"
                          includeMargin={false}
                        />
                        <div className="absolute inset-0 m-auto h-8 w-8 bg-white rounded-full flex items-center justify-center border border-neutral-100 shadow-sm">
                          <Heart className="h-4.5 w-4.5 text-red-500 fill-current animate-pulse" />
                        </div>
                      </div>

                      {/* Click to Copy UPI Address */}
                      <button 
                        onClick={handleCopyUPI}
                        className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 px-3 py-1.5 text-center text-[10px] font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center justify-center space-x-1.5 w-full max-w-[220px] cursor-pointer"
                      >
                        <span className="font-mono truncate">
                          {copied ? 'Copied ID!' : upiId}
                        </span>
                        <ClipboardCheck className={`h-3.5 w-3.5 shrink-0 ${copied ? 'text-green-600' : 'text-neutral-400'}`} />
                      </button>
                    </div>

                    {/* App Launchers */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-mono block">Direct UPI App Pay (₹1)</span>
                      
                      <a 
                        href={upiUri}
                        className="w-full py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 bg-white dark:bg-neutral-850 text-neutral-850 dark:text-neutral-100 text-[11px] font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer text-center"
                      >
                        <QrCode className="h-4 w-4 text-[#D4AF37]" />
                        <span>Launch UPI Application</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>

                      <div className="grid grid-cols-3 gap-2">
                        <a 
                          href={`tez://upi/pay?pa=${upiId}&pn=INDIAN%20POLITICS&am=1&cu=INR&tn=${encodeURIComponent(payDescription)}`}
                          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition text-center cursor-pointer text-[10px] font-bold text-neutral-700 dark:text-neutral-300"
                        >
                          Google Pay
                        </a>
                        <a 
                          href={`phonepe://pay?pa=${upiId}&pn=INDIAN%20POLITICS&am=1&cu=INR&tn=${encodeURIComponent(payDescription)}`}
                          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition text-center cursor-pointer text-[10px] font-bold text-neutral-700 dark:text-neutral-300"
                        >
                          PhonePe
                        </a>
                        <a 
                          href={`paytmmp://pay?pa=${upiId}&pn=INDIAN%20POLITICS&am=1&cu=INR&tn=${encodeURIComponent(payDescription)}`}
                          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition text-center cursor-pointer text-[10px] font-bold text-neutral-700 dark:text-neutral-300"
                        >
                          Paytm
                        </a>
                      </div>
                    </div>

                    {/* Reference Validation Form */}
                    <form onSubmit={handleUpiVerification} className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-2.5">
                      <label className="block text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-mono">
                        Submit UTR / Ref for verification
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                          placeholder="e.g. 620448102359"
                          className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 px-3 py-2 text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-neutral-400"
                        />
                        <button
                          type="submit"
                          disabled={status === 'verifying'}
                          className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-black uppercase tracking-wider flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          Verify
                        </button>
                      </div>
                      
                      {status === 'error' && (
                        <p className="text-[10px] text-red-600 dark:text-red-400 font-bold leading-relaxed">{errorMessage}</p>
                      )}
                    </form>
                  </div>
                ) : (
                  /* Success Screen inside Drawer */
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 py-6">
                    <Confetti
                      numberOfPieces={80}
                      recycle={false}
                      width={380}
                      height={500}
                    />

                    <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-bounce">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>

                    <h4 className="font-sans text-lg font-black text-neutral-900 dark:text-white">Gateway Check Verified!</h4>
                    <p className="text-[9px] text-emerald-800 dark:text-emerald-400 font-bold font-mono bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-150 px-3 py-1 rounded-full">
                      Ref Node: {generatedInvoice}
                    </p>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-[260px]">
                      Your ₹1 sandbox payment transaction was simulated successfully! It has been captured in the dashboard payment log files under sandbox telemetry checks. No profile credentials were changed.
                    </p>

                    <div className="pt-4 w-full">
                      <button
                        onClick={() => {
                          setStatus('idle');
                          setUtr('');
                        }}
                        className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-850 cursor-pointer transition"
                      >
                        Perform Another Check
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer section inside drawer */}
                {status !== 'success' && (
                  <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 mt-6">
                    <button
                      onClick={simulateSuccess}
                      disabled={status === 'verifying'}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#F9E29C] text-black text-xs font-black tracking-wide uppercase shadow-sm hover:brightness-110 cursor-pointer flex items-center justify-center space-x-1.5 transition"
                    >
                      {status === 'verifying' ? (
                        <span>Simulating Node...</span>
                      ) : (
                        <>
                          <span>Quick Test ₹1 Success</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
