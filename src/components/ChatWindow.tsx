import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, BookOpen, Sparkles } from 'lucide-react';
import { chatService, Message, AskResponse } from '../services/api';
import MessageBubble from './MessageBubble';
import SuggestionChip from './SuggestionChip';
import QuizPanel from './QuizPanel';
import { motion, AnimatePresence } from 'motion/react';

import FileUpload from './FileUpload';

const ChatWindow: React.FC = () => {


  const newChat = () => {

  const newId = crypto.randomUUID();
  sessionStorage.setItem("sessionId", newId);

  setMessages([
    { role: 'assistant', content: "Hello! I'm your AI Smart Study Assistant. What are we learning today?" }
  ]);

  };

  
  useEffect(() => {

  if (!sessionStorage.getItem("sessionId")) {
    const id = crypto.randomUUID();
    sessionStorage.setItem("sessionId", id);
  }
 

  }, []);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your AI Smart Study Assistant. What are we learning today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AskResponse | null>(null);
  const [activeQuizTopic, setActiveQuizTopic] = useState<string | null>(null);
  

  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLastResponse(null);

    try {
      const history = messages.slice(-10); // Keep last 10 messages for context
      const response = await chatService.ask(input, history);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
      console.log("Received response:", response);
        setLastResponse(response);
      
        console.log("Last Response", lastResponse);
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startQuiz = (topic: string) => {
    setActiveQuizTopic(topic);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-slate-50 shadow-2xl overflow-hidden border-x border-slate-200">
      {/* Header */}
      <header className="bg-white border-bottom border-slate-200 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Study Assistant</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-slate-500 font-medium">Online & Ready</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button
              onClick={newChat}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              New Chat
            </button>
           <FileUpload />
           <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
             <Sparkles size={20} />
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-2 scroll-smooth"
        >
          {messages.map((msg, idx) => (
            <MessageBubble 
              key={idx} 
              role={msg.role} 
              content={msg.content} 
              confidence={idx === messages.length - 1 && msg.role === 'assistant' ? lastResponse?.confidence : undefined}
            />
          ))}
          
          {isLoading && (
            <div className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200"></div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 className="animate-spin text-slate-400" size={16} />
                <span className="text-sm text-slate-400 font-medium">Thinking...</span>
              </div>
            </div>
          )}
          {lastResponse?.suggestion && !isLoading && (
            <SuggestionChip 
              message={lastResponse.suggestion.message} 
              topic={lastResponse.suggestion.topic} 
              onClick={startQuiz}
            />
          )}
        </div>

        {/* Quiz Overlay */}
        <AnimatePresence>
          {activeQuizTopic && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-sm p-6 flex items-center justify-center"
            >
              <div className="w-full max-w-2xl">
                <QuizPanel 
                  topic={activeQuizTopic} 
                  onClose={() => setActiveQuizTopic(null)} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Input Area */}
      <footer className="bg-white p-6 border-t border-slate-200">
        <div className="relative flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about your studies..."
              className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-slate-700 placeholder:text-slate-400"
              style={{ minHeight: '56px', maxHeight: '200px' }}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">Press Enter</span>
            </div>
          </div>
          <button
            disabled={!input.trim() || isLoading}
            onClick={handleSend}
            className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all active:scale-95 flex-shrink-0"
          >
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-4 font-medium uppercase tracking-widest">
          AI Smart Study Assistant • Powered by Gemini
        </p>
      </footer>
    </div>
  );
};

export default ChatWindow;
