import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  confidence?: 'low' | 'medium' | 'high';
}

const MessageBubble: React.FC<MessageBubbleProps> = ({role, content, confidence}) => {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex w-full mb-6 gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          isUser ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-700'
        )}
      >
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>

      <div
        className={cn(
          'max-w-[80%] px-4 py-3 rounded-2xl shadow-sm relative group',
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-none'
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
        )}
      >
        {!isUser && confidence && (
          <div className="absolute -top-3 left-0 flex gap-1">
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                confidence === 'high'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : confidence === 'medium'
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              )}
            >
              {confidence} confidence
            </span>
          </div>
        )}

        <div className="prose prose-sm max-w-none prose-slate">
          <ReactMarkdown>{typeof content === "string" ? content : String(content)}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
