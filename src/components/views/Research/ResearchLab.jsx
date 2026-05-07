import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Database, Globe, Zap, Loader2,
} from 'lucide-react';

const ResearchLab = ({ apiKey }) => {
  const [prompt, setPrompt] = useState('');
  const [useOllama, setUseOllama] = useState(false);
  const [chat, setChat] = useState([{ role: 'ai', text: 'Namaste, Dr. Prasada Murthy. Your private research lab is ready.' }]);
  const [isCooldown, setIsCooldown] = useState(false);
  const [requestLog, setRequestLog] = useState([]);

  const getRiskLevel = () => {
    const now = Date.now();
    const recent = requestLog.filter(time => now - time < 3600000); // Last hour
    if (recent.length >= 12) return { label: 'High Risk', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (recent.length >= 6) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { label: 'Optimal', color: 'text-green-500', bg: 'bg-green-500/10' };
  };

  const ask = async () => {
    if (!prompt || isCooldown) return;
    const history = [...chat, { role: 'user', text: prompt }];
    setChat(history); setPrompt('');
    if (useOllama) {
      try {
        const response = await fetch('http://localhost:11434/api/generate', { method: 'POST', body: JSON.stringify({ model: 'llama3', prompt: prompt, stream: false }) });
        const data = await response.json();
        setChat([...history, { role: 'ai', text: data.response }]);
      } catch (err) { setChat([...history, { role: 'ai', text: "Error connecting to local Ollama." }]); }
    } else {
      try {
        const systemPrompt = `You are the Research Intelligence of Pramu Talks. 
        MISSION: Provide ultra-concise research summaries (<150 words). 
        CONSTRAINTS: 1. Use bullet points for Key Insights. 2. Synthesis must be 1 short paragraph. 3. Always list sources. 
        Note: Only expand if user explicitly says "elaborate" or "deep dive".
        Analyze: ${prompt}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            tools: [{ "google_search_retrieval": { "dynamic_retrieval_config": { "mode": "MODE_DYNAMIC", "dynamic_threshold": 0.3 } } }]
          })
        });
        setRequestLog(prev => [...prev, Date.now()]);
        const result = await response.json();

        if (result.error && (result.error.code === 429 || result.error.status === 'RESOURCE_EXHAUSTED')) {
          setChat([...history, { role: 'ai', text: "Namaste. I'm currently reflecting on your recent queries to stay within my processing limits. Please wait about 60 seconds before our next analysis." }]);
          setIsCooldown(true);
          setTimeout(() => setIsCooldown(false), 60000);
          return;
        }

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis complete.";
        setChat([...history, { role: 'ai', text }]);
      } catch (err) {
        setChat([...history, { role: 'ai', text: "Gemini Cloud connection failed. Please check your API key." }]);
      }
    }
  };
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 h-[75vh] flex flex-col animate-in zoom-in-95 duration-300">
      <div className="bg-slate-900 rounded-[3rem] p-10 flex-1 flex flex-col shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-6 border-b border-white/10 text-white gap-4">
          <div className="flex items-center gap-4">
            <Database className="text-red-600" />
            <div>
              <h2 className="font-black text-xl uppercase tracking-tighter">Research Intelligence</h2>
              <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${getRiskLevel().bg} border border-white/5`}>
                <div className={`w-1 h-1 rounded-full animate-pulse ${getRiskLevel().color.replace('text-', 'bg-')}`} />
                <span className={`text-[8px] font-black uppercase tracking-widest ${getRiskLevel().color}`}>Quota: {getRiskLevel().label}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl px-4 border border-white/10">
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${useOllama ? 'text-amber-500' : 'text-blue-500'}`}>{useOllama ? <Cpu size={14} /> : <Globe size={14} />} {useOllama ? 'Ollama' : 'Gemini'}</div>
            <button onClick={() => setUseOllama(!useOllama)} className={`w-10 h-5 rounded-full relative transition-all ${useOllama ? 'bg-amber-600' : 'bg-slate-700'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useOllama ? 'left-6' : 'left-1'}`} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-6 pr-4 mb-8 custom-scrollbar">
          {chat.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-6 rounded-[2rem] max-w-[85%] text-sm font-medium ${m.role === 'user' ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-slate-300 border border-white/10 backdrop-blur-sm'}`}>
                {m.role === 'ai' ? (
                  <div className="markdown-content space-y-3">
                    <ReactMarkdown components={{
                      h1: ({ node, ...props }) => <h1 className="text-xl font-black uppercase tracking-tight text-white mb-4" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-lg font-black uppercase tracking-tight text-white mb-3" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-md font-bold text-red-500 mb-2" {...props} />,
                      p: ({ node, ...props }) => <p className="leading-relaxed opacity-90" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 ml-4" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 ml-4" {...props} />,
                      li: ({ node, ...props }) => <li className="marker:text-red-500" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-black text-red-500" {...props} />,
                      a: ({ node, ...props }) => <a className="text-red-500 font-bold underline decoration-red-500/30 hover:decoration-red-500 underline-offset-4 transition-all" target="_blank" rel="noopener noreferrer" {...props} />,
                      code: ({ node, ...props }) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                    }}>{m.text}</ReactMarkdown>
                  </div>
                ) : (
                  m.text
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="relative group">
          <div className="absolute -top-6 left-2 flex items-center gap-2 opacity-60 group-focus-within:opacity-100 transition-opacity">
            <Zap size={10} className="text-amber-500" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Smart Efficiency Mode Active • Concise Summaries Forced</span>
          </div>
          <div className="flex gap-4">
            <input className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium disabled:opacity-50" placeholder={isCooldown ? "Cooling down..." : "Query archives..."} value={prompt} onChange={e => setPrompt(e.target.value)} onKeyPress={e => e.key === 'Enter' && ask()} disabled={isCooldown} />
            <button onClick={ask} disabled={isCooldown} className="bg-white text-slate-900 px-10 rounded-2xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest disabled:opacity-50">
              {isCooldown ? <Loader2 size={12} className="animate-spin inline mr-2" /> : null}
              {isCooldown ? 'Cooldown' : 'Execute'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchLab;
