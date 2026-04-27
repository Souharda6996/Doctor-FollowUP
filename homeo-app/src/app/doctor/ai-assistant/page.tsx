'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Brain, Sparkles, ChevronDown } from 'lucide-react';
import { MOCK_PATIENTS } from '@/lib/mockData';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  ts: string;
}

const QUICK_PROMPTS = [
  'Summarize this patient\'s case',
  'What changed after the last treatment?',
  'Is improvement consistent with the treatment plan?',
  'Identify any red-flag symptoms I should review',
  'Check for medication adherence issues',
  'Are there any aggravating lifestyle factors?',
];

const AI_RESPONSES: Record<string, string> = {
  summarize: `**Case Summary — Ananya Patel (p001)**\n\nThis is a **chronic hypertension + migraine case**. Key features:\n\n• **Chief Complaint:** Migraines with visual aura, monthly cycles + BP control\n• **Duration:** 5+ years of migraines, 2 years of hypertension\n• **Pattern:** Migraines worse before menstruation, BP spikes with stress\n• **Current Medications:** Amlodipine 5mg, Aspirin 75mg, Vitamin D3\n• **Adherence:** 88% this week — good compliance\n\n**Treatment Response:** BP trending down from 148/96 → 128/84 over 14 months. Migraine frequency reducing.\n\n**Recommendation:** Continue current protocol. Monitor BP monthly. Consider stress-management referral.`,
  changed: `**Post-Treatment Changes — Last 14 Months**\n\nComparing Jan 2024 vs Apr 2026:\n\n**Improvements:**\n✅ BP: 148/96 → 128/84 (stable range)\n✅ Migraine frequency: Weekly → 3-4x per year\n✅ Severity: 8-9/10 → 3-4/10\n✅ Energy levels: Significantly improved\n✅ Medication adherence: 88% (excellent)\n\n**Still Working On:**\n🔄 Hormonal cycle-related migraine spikes\n🔄 Morning dizziness (medication timing adjustment advised)\n\n**AI Assessment:** Treatment is working well. Trend is positive.`,
  default: `I'm your **AI Clinical Assistant** for MediFollowUp.\n\nI can help you:\n• 📋 Summarize patient case histories\n• 💊 Review medication adherence and responses\n• 🧠 Detect symptom patterns and deterioration signals\n• 📈 Evaluate improvement trends\n• 🔴 Flag red-report lab values or urgent follow-ups\n\nSelect a patient context or type your question below.`,
};

function getAIResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('summar') || q.includes('case')) return AI_RESPONSES.summarize;
  if (q.includes('changed') || q.includes('after') || q.includes('remedy')) return AI_RESPONSES.changed;
  if (q.includes('improve') || q.includes('progress')) return `**Improvement Analysis**\n\nBased on symptom logs and remedy response data:\n\n• **Overall trend:** ↑ Steadily improving\n• **Severity average:** Dropped from 7.5 to 3.2 over 14 months\n• **Consistency:** Improvement is consistent with minor fluctuations\n• **Energy levels:** Improved from 2/5 to 4/5\n\n**AI Assessment:** Patient is on the right trajectory. Remedy is acting constitutionally. Recommend continuing current protocol.`;
  if (q.includes('remedy') || q.includes('suggest') || q.includes('treatment') || q.includes('prescri')) return `**Treatment Options to Consider**\n\n*(Assistive suggestion — doctor must validate)*\n\nBased on the symptom picture and patient history:\n\n1. **Continue current medications** — Good adherence, positive trend observed\n2. **Lifestyle modifications** — Stress management, dietary adjustments\n3. **Specialist referral** — Consider based on symptom persistence\n4. **Lab follow-up** — Recheck relevant markers in 4-6 weeks\n\n⚠️ AI suggestions only. Clinical judgment is required.`;
  return `I've analyzed your query about "${query}".\n\nBased on available patient data, here are my observations:\n\n• The symptom pattern shows a **consistent trend** — refer to recent logs for specifics\n• Long-term tracking shows **gradual improvement** in overall wellbeing\n• Consider reviewing follow-up adherence and medication logs for deeper insights\n\nWould you like me to analyze a specific aspect of this case in more detail?`;
}

export default function AIAssistantPage() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patient');
  const patient = patientId ? MOCK_PATIENTS.find((p) => p.id === patientId) : null;
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'ai', content: AI_RESPONSES.default, ts: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, ts: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);
    setShowQuick(false);
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 600));
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: getAIResponse(text), ts: new Date().toISOString() };
    setMessages((m) => [...m, aiMsg]);
    setThinking(false);
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/•\s/g, '• ')
      .split('\n')
      .map((line, i) => <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm shadow-purple-500/30">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">AI Clinical Assistant</h1>
            <p className="text-xs text-purple-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {patient ? `Context: ${patient.name}` : 'Powered by MediFollowUp AI'}
            </p>
          </div>
        </div>
        {patient && (
          <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">{patient.name.charAt(0)}</div>
            <span className="text-xs text-purple-700 font-medium">Analyzing case: {patient.name}</span>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0 mt-1 mr-2 shadow-sm shadow-purple-500/20">
                  <Brain className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm space-y-1 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                }`}
              >
                {msg.role === 'ai' ? renderMarkdown(msg.content) : <p>{msg.content}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator */}
        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-purple-400"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick prompts */}
        {showQuick && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <button
              onClick={() => setShowQuick(false)}
              className="text-xs text-slate-400 flex items-center gap-1 mx-auto"
            >
              Quick Prompts <ChevronDown className="w-3 h-3" />
            </button>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_PROMPTS.map((p) => (
                <motion.button
                  key={p}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage(p)}
                  className="bg-white border border-purple-200 text-purple-700 text-xs font-medium px-3 py-2 rounded-full hover:bg-purple-50 transition-colors shadow-sm"
                >
                  {p}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2">
            <textarea
              className="flex-1 bg-transparent resize-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none max-h-24"
              placeholder="Ask about a patient, remedy, or symptom pattern..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            />
            <button className="text-slate-400 hover:text-purple-600 transition-colors">
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || thinking}
            className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center disabled:opacity-40 shadow-sm shadow-purple-600/30"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
