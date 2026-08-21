import React, {useState, useRef, useEffect} from 'react';
import {createPortal} from 'react-dom';
import {base44} from '@/api/base44Client';
import {X, Send, Loader2, Bot, User, Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

const INITIAL_MSG = {
 role: 'assistant',
 content: 'Olá. Sou o **Zé**, assistente virtual da Prefeitura.\n\nPosso ajudar com:\n- Abrir ocorrências\n- Agendar consultas\n- Matrícula escolar\n- Serviços municipais\n\nO que você precisa?'
};

export default function AIAssistant() {
 const [open, setOpen] = useState(false);
 const [messages, setMessages] = useState([INITIAL_MSG]);
 const [input, setInput] = useState('');
 const [loading, setLoading] = useState(false);
 const bottomRef = useRef(null);
 const inputRef = useRef(null);

 useEffect(() => {
 if (open) {bottomRef.current?.scrollIntoView({behavior: 'smooth'}); inputRef.current?.focus();}
}, [messages, open]);

 const sendMessage = async () => {
 if (!input.trim() || loading) return;
 const userMsg = {role: 'user', content: input.trim()};
 setMessages(prev => [...prev, userMsg]);
 setInput('');
 setLoading(true);

 const history = messages.map(m =>`${m.role === 'user' ? 'Cidadão' : 'Zé'}: ${m.content}`).join('\n');

 const reply = await base44.integrations.Core.InvokeLLM({
 prompt:`Você é o"Zé", assistente virtual de uma prefeitura brasileira no sistema Zeladoria Smart City.
Seja prestativo, conciso e use linguagem simples e amigável.
Responda em português. Não use emojis.

Contexto da conversa:
${history}
Cidadão: ${input.trim()}

Serviços disponíveis no app:
- /nova-ocorrencia - registrar problemas urbanos
- /saude-publica - agendar consultas
- /matricula-escolar - matricular filhos
- /transparencia - dados públicos
- Botão SOS para emergências

Zé:`,
});

 setMessages(prev => [...prev, {role: 'assistant', content: reply}]);
 setLoading(false);
};

 const handleKey = (e) => {if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); sendMessage();}};

 const quickReplies = ['Quero registrar uma ocorrência', 'Agendar consulta médica', 'Matrícula escolar', 'Contato emergência'];

 return createPortal(
 <>
 {/* FAB */}
 {!open && (
 <button onClick={() => setOpen(true)}
 aria-label="Abrir assistente virtual"
 className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 md:bottom-8 md:right-8 z-[99999] w-16 h-16 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 flex items-center justify-center border-[3px] border-white active:scale-95 hover:scale-105 transition-all">
 <Bot className="w-8 h-8" />
 <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-[3px] border-white shadow-sm" />
 </button>
 )}

 {/* Chat window */}
 {open && (
 <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-[420px] z-[99999] flex flex-col bg-card rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-border overflow-hidden h-[70vh] md:h-[80vh] max-h-[750px] min-h-[420px] md:min-h-[500px]">
 {/* Header */}
 <div className="bg-primary p-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
 <Bot className="w-6 h-6 text-white" />
 </div>
 <div>
 <p className="text-white font-bold text-base">Zé — Assistente IA</p>
 <div className="flex items-center gap-1.5 mt-0.5">
 <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(134,239,172,0.8)]" />
 <span className="text-white/90 text-xs font-medium">Online agora</span>
 </div>
 </div>
 </div>
 <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20 rounded-full transition-colors" onClick={() => setOpen(false)}>
 <X className="w-5 h-5" />
 </Button>
 </div>

 {/* Messages */}
 <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
 {messages.map((msg, i) => (
 <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
 {msg.role === 'assistant' && (
 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 shadow-sm border border-primary/10">
 <Sparkles className="w-4 h-4 text-primary" />
 </div>
 )}
 <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-slate-200 rounded-tl-sm text-slate-700'}`}>
 {msg.role === 'assistant' ? (
 <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:text-[14px] [&_li]:text-[14px]">
 {msg.content}
 </ReactMarkdown>
 ) : msg.content}
 </div>
 {msg.role === 'user' && (
 <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1 shadow-sm border border-primary/20">
 <User className="w-4 h-4 text-white" />
 </div>
 )}
 </div>
 ))}
 {loading && (
 <div className="flex gap-3 items-center">
 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-primary/10 mt-1">
 <Sparkles className="w-4 h-4 text-primary" />
 </div>
 <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
 </div>
 </div>
 )}
 <div ref={bottomRef} />
 </div>

 {/* Quick replies */}
 {messages.length <= 1 && (
 <div className="px-4 py-3.5 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 bg-white">
 {quickReplies.map(r => (
 <button key={r} onClick={() => {setInput(r);}} className="shrink-0 text-[13px] bg-primary/5 text-primary border border-primary/20 rounded-full px-4 py-2 font-medium whitespace-nowrap hover:bg-primary hover:text-white transition-all shadow-sm">
 {r}
 </button>
 ))}
 </div>
 )}

 {/* Input */}
 <div className="p-3.5 border-t border-slate-100 flex gap-2 items-end bg-white">
 <textarea
 ref={inputRef}
 value={input}
 onChange={e => setInput(e.target.value)}
 onKeyDown={handleKey}
 placeholder="Digite sua mensagem..." rows={1}
 className="flex-1 resize-none text-[14px] bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 max-h-32 placeholder:text-slate-400" />
 <Button size="icon" className="h-[46px] w-[46px] rounded-2xl shrink-0 bg-primary hover:bg-primary/90 shadow-md transition-all" onClick={sendMessage} disabled={!input.trim() || loading}>
 {loading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Send className="w-5 h-5 text-white" />}
 </Button>
 </div>
 </div>
 )}
 </>,
 document.body
 );
}
