import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestionChipProps {
  message: string;
  topic: string;
  onClick: (topic: string) => void;
}

const SuggestionChip: React.FC<SuggestionChipProps> = ({ message, topic, onClick }) => {
  return (
    <div className="flex justify-center my-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => onClick(topic)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 rounded-full hover:shadow-md transition-all active:scale-95 group"
      >
        <Sparkles size={16} className="text-amber-500 group-hover:animate-pulse" />
        <span className="text-sm font-medium">{message}</span>
      </button>
    </div>
  );
};

export default SuggestionChip;
