'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Sparkles, Brain, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PatientChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', text: "Hello! I'm your AI health assistant. You can ask me about your current remedy, symptom patterns, or any health concerns you have today." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock AI response
    await new Promise(r => setTimeout(r, 1500));
    const aiResponse = { 
      id: Date.now() + 1, 
      role: 'ai', 
      text: "Based on your recent logs, it's normal to feel a bit tired after starting a new medication as your body adjusts. Your doctor recommends staying hydrated and getting adequate rest today. Should I log this 'feeling of tiredness' in your daily check-in?" 
    };
    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  return (
    <div className="flex-1 flex flex-col h-screen max-h-screen">
      <header className="bg-white border-b border-slate-100 p-5 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white">
            <Brain className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-900">Health Assistant</span>
        </div>
        <div className="w-5" />
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-3xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm shadow-lg shadow-blue-600/20' 
                : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-3 rounded-full flex gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl px-5 py-3 flex items-center gap-3">
            <input 
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400"
              placeholder="Type message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="text-slate-400">
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/30"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
