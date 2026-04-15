import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, BookOpen, Sparkles } from 'lucide-react';
import { chatService, Message, AskResponse, QuizQuestion ,chatHistoryService } from '../services/api';
import MessageBubble from './MessageBubble';
import SuggestionChip from './SuggestionChip';chatHistoryService
import QuizPanel from './QuizPanel';
import { motion, AnimatePresence, m } from 'motion/react';
import VoiceInput from './RecordBtn';


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
  const getUserId = () => {
  let userId = localStorage.getItem("userId");

  if (!userId) {
    userId = Math.random().toString(36).substring(2);
    localStorage.setItem("userId", userId);
  }

  return userId;
};

const userId = getUserId();
const [chatId, setChatId] = useState(
  localStorage.getItem("chatId") || null
);


  const newChat = async() => {

  const res = await fetch("http://localhost:5000/chat/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();

  setChatId(data.chatId);
  localStorage.setItem("chatId", data.chatId);

 

  setMessages([
    { role: 'assistant', content: "Hello! I'm your AI Smart Study Assistant. What are we learning today?" }
  ]);

  setLastResponse(null);
  setActiveQuizTopic(null);
  setEmbeddedQuizQuestions(null);

  };
  const loadChat = async (id) => {
  setChatId(id);
  localStorage.setItem("chatId", id);

  const res = await fetch(`http://localhost:3000/chat/${id}`);
  const data = await res.json();

  setMessages(data.messages || []);
};

  
  

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AskResponse | null>(null);
  const [activeQuizTopic, setActiveQuizTopic] = useState<string | null>(null);
  const [embeddedQuizQuestions, setEmbeddedQuizQuestions] = useState<QuizQuestion[] | null>(null);
  useEffect(() => {
  const loadInitialChat = async () => {
    if (!chatId) return;

    try {
      const data = await chatHistoryService.getHistory(chatId);
      

      if (data.messages?.length > 0) {
        setMessages(data.messages);
      } else {
        setMessages([
          { role: 'assistant', content: "Hello! I'm your AI Smart Study Assistant. What are we learning today?" }
        ]);
      }

    } catch (err) {
      console.error("Failed to load chat:", err);
    }
  };

  loadInitialChat();
}, [chatId]);
  
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    let currentChatId = chatId;
    if (!currentChatId) {
      // Create new chat session if it doesn't exist
      const res = await fetch("http://localhost:5000/chat/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      currentChatId = data.chatId;
      setChatId(currentChatId);
      localStorage.setItem("chatId", currentChatId);
    }
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLastResponse(null);

    try {
      const history = messages.slice(-10); // Keep last 10 messages for context
      const response = await chatService.ask(input, history,currentChatId,userId);
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

let mediaRecorder;
let audioChunks = [];

const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioChunks = [];
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

    const formData = new FormData();
    formData.append("file", audioBlob);

    const res = await fetch("http://localhost:8000/speech-to-text", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

      setInput(data.text); // fill input
    };

    mediaRecorder.start();
  };
  const stopRecording = () => {
  mediaRecorder.stop();
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-slate-50 shadow-2xl overflow-hidden border-x border-slate-200">
      {/* Header */}
      <header className="bg-white border-bottom border-slate-200 px-6 py-6 flex items-center justify-between z-10">
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
        <div className="flex items-center gap-3 h-full">
        <button
          onClick={newChat}
          className="h-10 px-4 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center"
        >
          New Chat
        </button>

        <div className="flex items-center h-10">
          <FileUpload />
        </div>

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
                  onClose={() => { setActiveQuizTopic(null); setEmbeddedQuizQuestions(null); }} 
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
  );
};

export default ChatWindow;
