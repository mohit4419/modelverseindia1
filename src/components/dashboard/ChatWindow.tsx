/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MapPin, Image, Paperclip, CheckCheck, Loader2, Sparkles, MessageCircle, AlertCircle, Clock,
  Volume2, VolumeX, Mic, MicOff, RefreshCw, X, ChevronRight, Check, Play, Info, Trash2
} from 'lucide-react';
import { Message, Model, Booking } from '../../types';
import { chatApi } from '../../api/chat.api';
import { dbService } from '../../services/db';

interface ChatWindowProps {
  model: Model;
  messages: Message[];
  clientId: string;
  onSendMessage: (content: string, imageUrl?: string, sendAsModel?: boolean) => void;
  bookingRef?: Booking;
  activeChatEndTime?: number | null;
  onTimerExpire?: () => void;
}

export default function ChatWindow({
  model,
  messages,
  clientId,
  onSendMessage,
  bookingRef,
  activeChatEndTime,
  onTimerExpire
}: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [imageInputUrl, setImageInputUrl] = useState('');
  const [showAttachmentOption, setShowAttachmentOption] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // Voice Coaching States
  const [showVoiceCoach, setShowVoiceCoach] = useState(false);
  const [coachingData, setCoachingData] = useState<{ tactics: string[]; coachVoiceLine: string }>({
    tactics: [
      `Secure Social Promotion: Since ${model.name} has solid reach as ${model.category}, ask if she includes digital social cross-posts.`,
      "Optimize Overtime Protection: Request a flat 4-hour half-day price rather than hourly limits to secure cost predictability.",
      `Offer Escrow Assurances: Explicitly highlight that 100% of the booking fee is fully deposited in secure Escrow.`
    ],
    coachVoiceLine: `Hey there! Since you are discussing dates with ${model.name}, I suggest negotiating flat day-rate packages and offering immediate escrow backing to secure a discount.`
  });
  const [isCoachingLoading, setIsCoachingLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCoachSpeaking, setIsCoachSpeaking] = useState(false);
  const [copiedTacticIndex, setCopiedTacticIndex] = useState<number | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearChat = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete the entire chat history? This action is permanent and cannot be undone.')) {
      return;
    }
    setIsClearing(true);
    try {
      await dbService.clearAllMessages();
      try {
        await chatApi.clearChats();
      } catch (e) {
        console.warn('Backend clear chats ignored or failed:', e);
      }
      setInputText('');
      window.location.reload();
    } catch (err: any) {
      alert('Error clearing chat history: ' + err.message);
    } finally {
      setIsClearing(false);
    }
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // 5-minute timer countdown logic
  useEffect(() => {
    if (!activeChatEndTime) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((activeChatEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && onTimerExpire) {
        onTimerExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeChatEndTime, onTimerExpire]);

  const isExpired = activeChatEndTime ? timeLeft === 0 : false;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Scroll to bottom when message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-IN'; // Optimized for Indian accent/context

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
          }
        };

        rec.onerror = (e: any) => {
          console.error('Speech recognition error:', e);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      } catch (err) {
        console.error('Failed to initialize Speech Recognition:', err);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not fully supported in this browser. Please try Google Chrome for real-time dictation!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Start recognition failed:', e);
      }
    }
  };

  // Speech Synthesis (Text-to-Speech)
  const speakCoachingLine = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Voice speech synthesis is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    if (isCoachSpeaking) {
      setIsCoachSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    // Prefer Indian English or standard English voices
    const premiumVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }

    utterance.onstart = () => {
      setIsCoachSpeaking(true);
    };

    utterance.onend = () => {
      setIsCoachSpeaking(false);
    };

    utterance.onerror = () => {
      setIsCoachSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Fetch real-time coaching suggestions from the Gemini server-side proxy
  const fetchCoachingSuggestions = async () => {
    setIsCoachingLoading(true);
    try {
      const res = await fetch('/api/chat/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: model.name,
          modelCategory: model.category,
          messages,
          budgetPrice: bookingRef?.priceAmount
        })
      });
      const data = await res.json();
      if (data && data.tactics) {
        setCoachingData(data);
      }
    } catch (e) {
      console.error('Failed to load real-time voice coaching:', e);
    } finally {
      setIsCoachingLoading(false);
    }
  };

  // Real-time tracking: refresh coaching whenever messages update
  useEffect(() => {
    if (showVoiceCoach && messages.length > 0) {
      fetchCoachingSuggestions();
    }
  }, [messages.length, showVoiceCoach]);

  const handleApplyTactic = (tactic: string, index: number) => {
    let customizedText = '';
    const name = model.name;
    const price = bookingRef?.priceAmount ? `₹${bookingRef.priceAmount.toLocaleString()}` : '₹45,000';
    
    if (tactic.toLowerCase().includes('social') || tactic.toLowerCase().includes('usage') || tactic.toLowerCase().includes('promotion')) {
      customizedText = `Hi ${name}, I'm keen on booking! Can we confirm that digital and social media cross-promotion rights for 6 months are included in our current ${price} budget package?`;
    } else if (tactic.toLowerCase().includes('day') || tactic.toLowerCase().includes('hourly') || tactic.toLowerCase().includes('overtime') || tactic.toLowerCase().includes('limit')) {
      customizedText = `Hi ${name}, to ensure a smooth shoot flow without scheduling constraints, would you be open to structuring this booking as a flat half-day package rate instead?`;
    } else if (tactic.toLowerCase().includes('escrow') || tactic.toLowerCase().includes('deposit') || tactic.toLowerCase().includes('safe') || tactic.toLowerCase().includes('trust')) {
      customizedText = `Hi ${name}, please note that 100% of our active booking rate (${price}) is securely deposited under ModelVerse Escrow Safeguards, ensuring guaranteed payout immediately on campaign sign-off. Shall we lock in the shoot dates?`;
    } else {
      customizedText = `Hi ${name}, regarding our campaign shoot, I'd love to lock down the dates right here on ModelVerse. Can we finalize a flat deal under our active escrow system?`;
    }
    
    setInputText(customizedText);
    setCopiedTacticIndex(index);
    setTimeout(() => setCopiedTacticIndex(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !imageInputUrl) return;

    onSendMessage(inputText.trim(), imageInputUrl || undefined);
    setInputText('');
    setImageInputUrl('');
    setShowAttachmentOption(false);

    // Simulate AI Model replying after a small delay
    setIsTyping(true);

    // Call server-side API proxy (Gemini)
    setTimeout(async () => {
      try {
        const res = await fetch('/api/chat/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelName: model.name,
            modelCategory: model.category,
            modelBiography: model.biography,
            messages,
            userMessage: inputText,
            clientId,
            modelId: model.id
          })
        });
        const data = await res.json();
        setIsTyping(false);
        // Call parent callback to append model's reply
        onSendMessage(data.response || data.reply, undefined, true); // sendAsModel flag
      } catch (err) {
        setIsTyping(false);
        onSendMessage(`Thanks for your proposal! I'll review the details of "${bookingRef?.projectDetails.brandName || 'your campaign'}" and coordinate with my booking agency. Let's process the dates right here!`, undefined, true);
      }
    }, 2500);
  };

  return (
    <div id="model-chat-portal" className="border border-white/5 rounded-2xl bg-[#121212] shadow-2xl overflow-hidden flex flex-col h-[600px] max-w-5xl mx-auto text-white transition-all duration-300">
      
      {/* Header bar showing active model status */}
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-[#0a0a0a] text-white">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={model.portfolio[0]}
              alt={model.name}
              referrerPolicy="no-referrer"
              className="h-10 w-10 rounded-full object-cover border border-white/10"
            />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-[#0a0a0a]" />
          </div>
          <div>
            <h4 className="font-sans text-sm font-extrabold flex items-center gap-1.5">
              <span>{model.name}</span>
              <span className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-mono">Model</span>
            </h4>
            <span className="text-[10px] text-zinc-400">{model.category} • active now</span>
          </div>
        </div>

        {/* Real-time Voice Coach Toggle + Session Timers */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleClearChat}
            disabled={isClearing}
            title="Delete entire chat history"
            id="clear-chats-btn"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-50"
          >
            {isClearing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Delete Chat</span>
          </button>

          <button
            onClick={() => {
              const nextState = !showVoiceCoach;
              setShowVoiceCoach(nextState);
              if (nextState) {
                fetchCoachingSuggestions();
              }
            }}
            id="voice-coach-toggle-btn"
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              showVoiceCoach 
                ? 'bg-gradient-to-tr from-[#D4AF37] to-[#F9E29C] text-black shadow-lg shadow-[#D4AF37]/10 scale-102 border border-yellow-300/30' 
                : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${showVoiceCoach ? 'text-black' : 'text-[#D4AF37]'}`} />
            <span>🎙️ AI Voice Coach</span>
          </button>

          {activeChatEndTime && timeLeft > 0 ? (
            <div className="flex items-center space-x-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full py-1.5 px-3.5 text-xs font-bold font-mono animate-pulse">
              <Clock className="h-3.5 w-3.5 text-rose-500 animate-spin" style={{ animationDuration: '3s' }} />
              <span>Session Ends: {formatTime(timeLeft)}</span>
            </div>
          ) : activeChatEndTime && timeLeft === 0 ? (
            <div className="flex items-center space-x-1.5 bg-rose-950/80 border border-rose-500/30 text-rose-400 rounded-full py-1.5 px-3.5 text-xs font-bold font-mono">
              <Clock className="h-3.5 w-3.5 text-rose-500" />
              <span>Session Expired</span>
            </div>
          ) : bookingRef ? (
            <div className="hidden sm:block text-right bg-white/5 border border-white/10 rounded-xl px-3.5 py-1.5 text-[10px]">
              <span className="block text-zinc-500 uppercase font-mono tracking-widest text-[8px]">Active Booking</span>
              <strong className="text-[#D4AF37]">{bookingRef.projectDetails.brandName}</strong>
              <span className="ml-1.5 text-zinc-300 font-bold capitalize">[{bookingRef.status}]</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] rounded-full py-1 px-3 text-[10px] font-bold">
              <Sparkles className="h-3 w-3" />
              <span>Chatting via Secure Escrow</span>
            </div>
          )}
        </div>
      </div>

      {/* Booking Quick Reference Guide */}
      {bookingRef && (
        <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/20 p-3 px-6 text-xs text-zinc-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[#D4AF37] shrink-0" />
            <p>
              Booking proposal <strong className="text-white">₹{bookingRef.priceAmount.toLocaleString()}</strong> is pending model acceptance.
            </p>
          </div>
          <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-[#D4AF37] bg-white/5 border border-white/10 rounded px-2 py-0.5">
            MVI-Ref-{bookingRef.id}
          </span>
        </div>
      )}

      {/* Main Body Section with Horizontal Flex to hold Voice Coaching Side HUD */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Section: Active chat messages and inputs */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-[#0d0d0d]">
            
            {messages.length === 0 ? (
              <div className="text-center py-24 flex flex-col items-center">
                <MessageCircle className="h-10 w-10 text-zinc-700 animate-bounce" />
                <h5 className="text-xs font-bold text-zinc-300 mt-2">Start Secure Conversation</h5>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
                  Introduce your fashion campaign and negotiate budget rate scales here. Do not exchange numbers.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === clientId;
                const isSystem = msg.senderId === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="mx-auto text-center py-1 max-w-md">
                      <span className="inline-block text-[10px] bg-white/5 text-zinc-400 px-3 py-1 rounded-full font-semibold border border-white/10">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end space-x-2 max-w-[75%] ${isMe ? 'ml-auto justify-end' : 'mr-auto'}`}
                  >
                    {!isMe && (
                      <img
                        src={model.portfolio[0]}
                        alt={model.name}
                        referrerPolicy="no-referrer"
                        className="h-6 w-6 rounded-full object-cover border border-white/10"
                      />
                    )}

                    <div className="space-y-1 bg-transparent">
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${
                          isMe 
                            ? 'bg-gradient-to-tr from-[#D4AF37] to-[#F9E29C] text-black font-semibold rounded-br-none' 
                            : 'bg-white/5 border border-white/5 text-zinc-100 rounded-bl-none'
                        }`}
                      >
                        {/* Render newlines */}
                        <p className="whitespace-pre-line">{msg.content}</p>

                        {/* Image Attachment showcase */}
                        {msg.imageUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                            <img src={msg.imageUrl} alt="attachment" referrerPolicy="no-referrer" className="max-h-40 object-cover w-full" />
                          </div>
                        )}
                      </div>

                      {/* Timestamp & Read state info */}
                      <div className={`flex items-center space-x-1 text-[8px] text-zinc-550 ${isMe ? 'justify-end' : ''}`}>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck className="h-3 w-3 text-emerald-400" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Model Typing Loading Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 max-w-[75%]">
                <img
                  src={model.portfolio[0]}
                  alt={model.name}
                  referrerPolicy="no-referrer"
                  className="h-6 w-6 rounded-full object-cover border border-white/10"
                />
                <div className="rounded-2xl bg-white/5 border border-white/5 px-4 py-2.5 shadow-sm text-xs text-zinc-400 flex items-center space-x-1.5 font-semibold">
                  <Loader2 className="h-3 w-3 animate-spin text-[#D4AF37]" />
                  <span>{model.name} is drafting a reply...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input bar and attachments block */}
          <div className="border-t border-white/5 p-4 bg-[#121212]">
            {isExpired && (
              <div className="mb-4 flex items-start space-x-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-left text-rose-350 text-[11px] animate-fadeIn">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Premium Chat Session Expired:</strong> Your 5-minute premium chat session with <span className="font-bold text-white">{model.name}</span> has expired. Please go to the <strong>Pricing Plans</strong> to purchase another unlock and continue chatting.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* Collapsible Attachment Dialog */}
              {showAttachmentOption && !isExpired && (
                <div className="rounded-xl border border-dashed border-white/15 p-3 bg-white/5 flex items-center gap-2 animate-fadeIn">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase whitespace-nowrap">Image link:</span>
                  <input
                    type="text"
                    placeholder="Paste portfolio link (https://...)"
                    value={imageInputUrl}
                    disabled={isExpired}
                    onChange={(e) => setImageInputUrl(e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-[#121212] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#D4AF37] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setImageInputUrl('')}
                    disabled={isExpired}
                    className="text-xs font-semibold text-red-400 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {/* Attachment Button */}
                <button
                  type="button"
                  disabled={isExpired}
                  onClick={() => setShowAttachmentOption(!showAttachmentOption)}
                  className="rounded-full h-10 w-10 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 transition shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Attach Campaign moodboard or shoot designs"
                >
                  <Image className="h-4.5 w-4.5" />
                </button>

                {/* Speech Dictation Mic Button */}
                <button
                  type="button"
                  disabled={isExpired}
                  onClick={toggleListening}
                  className={`rounded-full h-10 w-10 flex items-center justify-center border transition shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isListening 
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse' 
                      : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                  }`}
                  title={isListening ? "Stop listening to voice" : "Speak to dictate message text"}
                >
                  {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                </button>

                {/* Main Message input layout */}
                <input
                  type="text"
                  placeholder={
                    isListening 
                      ? "🎙️ Listening to your voice..." 
                      : isExpired 
                        ? "Chat session expired..." 
                        : `Send secure message to ${model.name}...`
                  }
                  value={inputText}
                  disabled={isExpired}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 rounded-full border border-white/10 px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#D4AF37] bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  id="chat-send-submit"
                  disabled={isExpired}
                  className="rounded-full h-10 w-10 flex items-center justify-center bg-gradient-to-tr from-[#D4AF37] to-[#F9E29C] text-black hover:brightness-110 transition shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>

            <p className="text-[9px] text-center text-zinc-500 mt-2.5 font-medium flex items-center justify-center gap-1">
              🛡️ Secure messaging under Escrow Protocol. Please do not submit real phone handles. Close deals safely here.
            </p>
          </div>
        </div>

        {/* Right Section: Real-Time AI Negotiation Voice Coaching HUD Sidebar */}
        {showVoiceCoach && (
          <div className="w-80 border-l border-white/5 bg-[#0a0a0a] flex flex-col h-full overflow-y-auto transition-all duration-300">
            
            {/* Sidebar Title */}
            <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                <h5 className="text-xs font-black uppercase tracking-wider text-white">AI Negotiation Coach</h5>
              </div>
              <button 
                onClick={() => setShowVoiceCoach(false)}
                className="text-zinc-500 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Coach Voice Avatar and Line */}
            <div className="p-4 border-b border-white/5 bg-[#121212]/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="relative">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-300 flex items-center justify-center shadow-md">
                      <Sparkles className="h-4.5 w-4.5 text-black" />
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#0a0a0a]" />
                  </div>
                  <div>
                    <h6 className="text-[11px] font-bold text-zinc-200">Coach Ava</h6>
                    <span className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-widest font-bold">Vocal feedback ready</span>
                  </div>
                </div>

                {/* Trigger read coaching feedback aloud */}
                <button
                  onClick={() => speakCoachingLine(coachingData.coachVoiceLine)}
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition border cursor-pointer ${
                    isCoachSpeaking 
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse' 
                      : 'bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/20 hover:text-white'
                  }`}
                  title={isCoachSpeaking ? "Mute Coach Ava" : "Listen to Ava's vocal tip"}
                >
                  {isCoachSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Coach text line bubble */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 relative">
                <p className="text-[11px] text-zinc-300 italic leading-relaxed">
                  "{coachingData.coachVoiceLine}"
                </p>
                {isCoachSpeaking && (
                  <div className="absolute bottom-1 right-2 flex items-center space-x-0.5">
                    <span className="w-0.5 h-1.5 bg-[#D4AF37] rounded animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-0.5 h-3.5 bg-[#D4AF37] rounded animate-bounce" style={{ animationDelay: '0.3s' }} />
                    <span className="w-0.5 h-2.5 bg-[#D4AF37] rounded animate-bounce" style={{ animationDelay: '0.5s' }} />
                    <span className="w-0.5 h-4 bg-[#D4AF37] rounded animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Negotiation Tactics recommendation list */}
            <div className="p-4 flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Suggested Tactics</span>
                <button
                  onClick={fetchCoachingSuggestions}
                  disabled={isCoachingLoading}
                  className="text-zinc-500 hover:text-[#D4AF37] transition flex items-center space-x-1 text-[10px] font-bold cursor-pointer disabled:opacity-40"
                  title="Request latest tactics from Gemini"
                >
                  <RefreshCw className={`h-3 w-3 ${isCoachingLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {isCoachingLoading ? (
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Analyzing Discussion...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {coachingData.tactics.map((tactic, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleApplyTactic(tactic, idx)}
                      className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#D4AF37]/25 transition-all duration-200 text-left cursor-pointer select-none"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center space-x-1.5 text-[9px] font-mono font-bold uppercase text-[#D4AF37]">
                          <Sparkles className="h-3 w-3 shrink-0" />
                          <span>Tactic #{idx + 1}</span>
                        </div>
                        <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-400 group-hover:text-white group-hover:bg-[#D4AF37]/20 transition-all">
                          {copiedTacticIndex === idx ? 'Applied! ✓' : 'Use draft ↗'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 mt-1.5 group-hover:text-white transition leading-relaxed">
                        {tactic}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Informative tips box */}
              <div className="p-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-start space-x-2 text-[10px] text-zinc-400 leading-relaxed mt-4">
                <Info className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-300 block mb-0.5">How it works:</strong>
                  Click on any tactic above to instantly draft an expert, pre-structured negotiation message in your chat input box customized to {model.name}!
                </div>
              </div>
            </div>

            {/* Direct Speech Dictation Callout */}
            <div className="p-4 border-t border-white/5 bg-black/40 text-center space-y-2">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Hands-free voice mode</span>
              <button
                onClick={toggleListening}
                className={`w-full py-2.5 rounded-xl border font-black uppercase tracking-wider text-xs transition flex items-center justify-center space-x-2 cursor-pointer ${
                  isListening
                    ? 'bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse shadow-md shadow-rose-500/10'
                    : 'bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/20'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4 text-rose-400" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 text-[#D4AF37]" />
                    <span>Start Voice Dictation</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
