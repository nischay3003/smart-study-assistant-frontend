import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Activity, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ThoughtStreamProps {
  chatId: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

interface Step {
  id: string;
  message: string;
  status: 'in-progress' | 'completed';
}

/**
 * ThoughtStream Component
 * 
 * Connects to a WebSocket to display a list-wise live feed of "behind the scenes" 
 * agent status updates with checkmarks for completion and spinners for progress.
 */
const ThoughtStream: React.FC<ThoughtStreamProps> = ({ chatId, onConnected, onDisconnected }) => {
  const [steps, setSteps] = useState<Step[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Use a ref to keep track of the current step IDs to avoid duplicates easily within onmessage
  const stepsRef = useRef<string[]>([]);

  useEffect(() => {
    const wsUrl = `ws://localhost:8000/ws/${chatId}`;
    let socket: WebSocket;
    
    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsConnected(true);
        setErrorMsg(null);
        onConnected?.();
      };

      socket.onmessage = (event) => {
        const rawData = event.data.toString();
        
        // Skip log delimiters if present (e.g. "12345")
        if (rawData.trim() === '12345') return;

        try {
          const data = JSON.parse(rawData);
          
          if (data.type === 'status') {
            const stepId = data.step || 'default';
            const message = data.message || 'Thinking...';

            setSteps(prev => {
              const existingIndex = prev.findIndex(s => s.id === stepId);
              
              if (existingIndex !== -1) {
                // Update existing step
                const newSteps = [...prev];
                newSteps[existingIndex] = { ...newSteps[existingIndex], message, status: 'in-progress' };
                return newSteps;
              } else {
                // Add new step and mark all previous ones as completed
                const updatedPrev = prev.map(s => ({ ...s, status: 'completed' as const }));
                return [...updatedPrev, { id: stepId, message, status: 'in-progress' }];
              }
            });
          }
        } catch (err) {
          // If it's not JSON, treat it as a raw message step
          setSteps(prev => {
            const updatedPrev = prev.map(s => ({ ...s, status: 'completed' as const }));
            return [...updatedPrev, { id: Date.now().toString(), message: rawData, status: 'in-progress' }];
          });
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        onDisconnected?.();
      };

      socket.onerror = () => {
        setIsConnected(false);
        setErrorMsg('Stream connection failed');
      };
    } catch (err) {
      setErrorMsg('Could not establishment stream');
    }

    return () => {
      if (socket) socket.close();
    };
  }, [chatId]);

  return (
    <div className="flex flex-col gap-3 py-1">
      <AnimatePresence>
        {errorMsg ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-xs text-rose-500 font-medium px-1"
          >
            {errorMsg}
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {steps.length === 0 && !isConnected && (
              <div className="flex items-center gap-2 text-slate-400 text-sm italic px-1">
                <Loader2 size={14} className="animate-spin" />
                Initializing...
              </div>
            )}
            
            {steps.map((step, idx) => (
              <motion.div 
                key={step.id + idx}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 group"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {step.status === 'completed' ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <div className="relative">
                      <Loader2 size={16} className="animate-spin text-indigo-500" />
                      <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-[2px] animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    step.status === 'completed' ? 'text-slate-400' : 'text-slate-700'
                  }`}>
                    {step.message}
                  </span>
                  {step.status === 'in-progress' && (
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest animate-pulse">
                      In Progress
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {isConnected && steps.length > 0 && (
        <div className="flex items-center gap-1.5 px-1 mt-1 border-t border-slate-50 pt-2">
          <Activity size={10} className="text-emerald-400 animate-pulse" />
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
            Live Feed: http://localhost:8000/ws/{chatId.slice(0,8)}...
          </span>
        </div>
      )}
    </div>
  );
};

export default ThoughtStream;
