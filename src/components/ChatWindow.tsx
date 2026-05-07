import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, BookOpen, Sparkles } from 'lucide-react';
import { chatService, chatSessionService, Message, AskResponse, QuizQuestion, chatHistoryService, ChatDocument } from '../services/api';
import MessageBubble from './MessageBubble';
import SuggestionChip from './SuggestionChip';
import QuizPanel from './QuizPanel';
import { motion, AnimatePresence, m } from 'motion/react';
import VoiceInput from './RecordBtn';
import LogoutButton from './LogoutButton';
import Sidebar, { Chat } from './Sidebar';

import FileUpload from './FileUpload';




const ChatWindow: React.FC = () => {
  

  const isQuizQuestion = (value: any): value is QuizQuestion => {
    return (
      value &&
      typeof value === 'object' &&
      typeof value.question === 'string' &&
      Array.isArray(value.options) &&
      typeof value.answerIndex === 'number'
    );
  };

  const formatAskResponse = (response: AskResponse) => {
    const answerItems = Array.isArray(response.answer) ? response.answer : [response.answer];
    const textParts: string[] = [];
    const quizItems: QuizQuestion[] = [];

  

   answerItems.forEach((item) => {

      if (typeof item === 'string') {
        console.log("Adding text item:", item);
        textParts.push(item.trim());

      } else if (isQuizQuestion(item)) {
        // Direct quiz object (rare case)
        quizItems.push(item);

      } else if (item && typeof item === 'object') {
        
        // ✅ HANDLE NESTED QUESTIONS ARRAY
        if (Array.isArray(item.questions)) {
          item.questions.forEach((q: any) => {
            if (isQuizQuestion(q)) {
              quizItems.push(q);
            }
          });
        } else {
          // fallback
          textParts.push(JSON.stringify(item, null, 2));
        }
      }
    });
    const text = textParts.filter(Boolean).join('\n\n').trim();
    let quizMarkdown = '';


    if (quizItems.length > 0) {
      quizMarkdown = quizItems
        .map((q, idx) => {
          const optionsText = q.options
            .map((option, optionIndex) => `- ${String.fromCharCode(65 + optionIndex)}. ${option}`)
            .join('\n');

          const answerLabel = q.options[q.answerIndex]
            ? `${String.fromCharCode(65 + q.answerIndex)}. ${q.options[q.answerIndex]}`
            : 'N/A';

          return `### Quiz Question ${idx + 1}\n**${q.question}**\n\n${optionsText}\n\n**Answer**: ${answerLabel}`;
        })
        .join('\n\n---\n\n');
    }

    return { text, quizMarkdown, quizItems };
  };

  const [chats, setChats] = useState<Chat[]>([]);
  const [chatId, setChatId] = useState<string | null>(sessionStorage.getItem("chatId"));
  const chatIdRef = useRef<string | null>(sessionStorage.getItem("chatId"));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AskResponse | null>(null);
  const [queryDuration, setQueryDuration] = useState<number | null>(null);
  const [documents, setDocuments] = useState<ChatDocument[]>([]);
  const [activeQuizTopic, setActiveQuizTopic] = useState<string | null>(null);
  const [embeddedQuizQuestions, setEmbeddedQuizQuestions] = useState<QuizQuestion[] | undefined>(undefined);

  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  useEffect(() => {
    const loadChats = async () => {
      const token = sessionStorage.getItem("token");

      const res = await chatSessionService.findChats(token);
      setChats(res);
    };

    loadChats();
  }, []);

  const newChat = async () => {
    const data = await chatSessionService.createChat();
    const newChatId = data.chatId;

    console.log('New chat created with ID:', newChatId);
    chatIdRef.current = newChatId;
    setChatId(newChatId);
    sessionStorage.setItem('chatId', newChatId);
    setLastResponse(null);
    setActiveQuizTopic(null);
    setEmbeddedQuizQuestions(undefined);
    setDocuments([]);

    setMessages([
      { role: 'assistant', content: "Hello! I'm your AI Smart Study Assistant. What are we learning today?" }
    ]);
    setChats(prev => [{ chatId: newChatId, title: "New Chat" }, ...prev]);
  };

  const loadChat = async (id: string) => {
    setChatId(id);
    sessionStorage.setItem('chatId', id);
    setDocuments([]);
    // const data = await chatSessionService.loadChat(id);
    // setMessages(data.messages || [{ role: 'assistant', content: "Hello! I'm your AI Smart Study Assistant. What are we learning today?" }]);
  };

  const loadInitialChat = async (chatId: string | null) => {
    if (!chatId) return;

    try {
      const data = await chatHistoryService.getHistory(chatId);

      const greeting: Message = {
        role: 'assistant',
        content: "Hello! I'm your AI Smart Study Assistant. What are we learning today?"
      };

      if (data.messages?.length > 0) {
        setMessages([greeting, ...data.messages]);
      } else {
        setMessages([greeting]);
      }

      setDocuments(data.documents ?? []);
      console.log("Documents set", data.documents ?? []);

    } catch (err) {
      console.error("Failed to load chat:", err);
    }
  };

  useEffect(() => {
    loadInitialChat(chatId);
  }, [chatId]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);
  
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    let currentChatId = chatIdRef.current; // ✅ use ref to get latest chatId

    if (!currentChatId) {
      const data = await chatSessionService.createChat();
      currentChatId = data.chatId;
      chatIdRef.current = currentChatId;
      setChatId(currentChatId);
      sessionStorage.setItem('chatId', currentChatId);
      
    }
    if (messages.length === 1) {
      
    setChats((prev) =>
      prev.map((chat) =>
        chat.chatId === chatId
          ? { ...chat, title: input.slice(0, 40) }
          : chat
      )
    );
    }
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLastResponse(null);
    setQueryDuration(null);
    const requestStart = performance.now();

    try {
      const history = [...messages, userMessage].slice(-10); // Keep last 10 messages for context
      const response = await chatService.ask(input, history, currentChatId);
      const requestEnd = performance.now();
      setQueryDuration((requestEnd - requestStart) / 1000);
      console.error("Response from API:", response);

          const { text, quizMarkdown, quizItems } = formatAskResponse(response);
    
      setMessages(prev => {
        const next = [...prev];
        if (text) next.push({ role: 'assistant', content: text });
        if (quizMarkdown) next.push({ role: 'assistant', content: quizMarkdown });
        if (!text && !quizMarkdown) {
          next.push({ role: 'assistant', content: "Sorry, I couldn't parse a valid answer from the API response." });
        }
        return next;
      });

      if (quizItems.length > 0) {
        setEmbeddedQuizQuestions(quizItems);
        setActiveQuizTopic(response.topic);
      }

      
      setLastResponse(response);
      

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
    <div className="flex h-screen bg-slate-100">
       <Sidebar
      chats={chats}
      currentChatId={chatId}
      onSelectChat={loadChat}
      onNewChat={newChat}
      documents={documents}
      setDocuments={setDocuments}
    />
    <div className="flex flex-col h-screen w-full max-w-4xl mx-auto bg-slate-50 shadow-2xl overflow-hidden border-x border-slate-200 width">
      {/* Header */}
      <header className="bg-white border-bottom border-slate-200 px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">StudyGenie AI</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-slate-500 font-medium">Online & Ready</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 h-full">
        {/* <button
          onClick={newChat}
          className="h-10 px-4 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center"
        >
          New Chat
        </button> */}
                  

          

        <div className="flex items-center h-10">
          {chatId ? (
          <FileUpload chatId={chatId} onUploadSuccess={() => { loadInitialChat(chatId); }} />
        ) : null}
        </div>

        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
          <Sparkles size={20} />
        </button>

        {/* <LogoutButton /> */}
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
                <span className="text-sm text   -slate-400 font-medium">Thinking...</span>
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

          {queryDuration !== null && !isLoading && (
            <div className="mt-3 text-right text-xs text-slate-500">
              Response time: {queryDuration.toFixed(3)}s
            </div>
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
                  questions={embeddedQuizQuestions}
                  onClose={() => { setActiveQuizTopic(null); setEmbeddedQuizQuestions(undefined); }} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Input Area */}
      <footer className="bg-white p-6 border-t border-slate-200">
        <div className="relative flex items-center gap-3 items-center">
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
          <VoiceInput 
            setQuestion={setInput} 
            handleSubmit={handleSend} 
          />
          <button
            disabled={!input.trim() || isLoading}
            onClick={handleSend}
            className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all active:scale-95 flex-shrink-0"
          >
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
          </button>
          
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-4 font-medium uppercase tracking-widest">
          • AI Smart Study Assistant • 
        </p>
      </footer>
    </div>
    </div>
  );
};

export default ChatWindow;
