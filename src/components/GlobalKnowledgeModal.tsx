import React, { useState, useCallback } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Database, 
  Type, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminService } from '../services/api';

interface GlobalKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  'General',
  'Science',
  'Mathematics',
  'Literature',
  'History',
  'Computer Science',
  'Business',
  'Other'
];

const GlobalKnowledgeModal: React.FC<GlobalKnowledgeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'text'>('file');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);

  const resetForm = useCallback(() => {
    setTitle('');
    setCategory(CATEGORIES[0]);
    setDescription('');
    setFile(null);
    setRawText('');
    setStatus('idle');
    setErrorMessage('');
    setProgress(0);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(selectedFile.type)) {
        setErrorMessage('Invalid file type. Please upload PDF, DOCX, or TXT.');
        setStatus('error');
        return;
      }
      setFile(selectedFile);
      setStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (uploadType === 'file' && !file) || (uploadType === 'text' && !rawText)) {
      setErrorMessage('Please fill in all required fields.');
      setStatus('error');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    
    // Simulate progress for UI feedback
    const progressInterval = setInterval(() => {
      setProgress(p => p < 90 ? p + 10 : p);
    }, 200);

    try {
      await adminService.ingestGlobalKnowledge({
        title,
        category,
        description,
        file: uploadType === 'file' ? (file || undefined) : undefined,
        rawText: uploadType === 'text' ? rawText : undefined,
      });
      
      setProgress(100);
      setStatus('success');
      onSuccess?.();
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (error) {
      setStatus('error');
      setErrorMessage('Failed to ingest knowledge. Please try again.');
    } finally {
      clearInterval(progressInterval);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <Database size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Global Knowledge Ingestion</h3>
                <p className="text-xs text-slate-500 font-medium">Add shared resources for all students</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Document Title*</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Mathematics 101 Handbook"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Subject Category*</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full appearance-none px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description (Optional)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of the knowledge base..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white resize-none"
                />
              </div>

              {/* Upload Type Selection */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUploadType('file')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                    uploadType === 'file' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Upload size={16} />
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('text')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                    uploadType === 'text' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Type size={16} />
                  Raw Text
                </button>
              </div>

              {/* Dynamic Input Section */}
              <AnimatePresence mode="wait">
                {uploadType === 'file' ? (
                  <motion.div
                    key="file-upload"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedFile = e.dataTransfer.files[0];
                        if (droppedFile) {
                          handleFileChange({ target: { files: [droppedFile] } } as any);
                        }
                      }}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                      onClick={() => document.getElementById('knowledge-file')?.click()}
                    >
                      <input 
                        id="knowledge-file"
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.txt"
                      />
                      <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <Upload size={28} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {file ? file.name : "Click or drag file to upload"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">PDF, DOCX, or TXT (Max 50MB)</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="text-input"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <textarea 
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Paste your knowledge content here..."
                      rows={6}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white resize-none font-mono text-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Message */}
              {status === 'error' && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
                  <AlertCircle size={18} />
                  <p className="text-sm font-medium">{errorMessage}</p>
                </div>
              )}

              {status === 'success' && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={18} />
                  <p className="text-sm font-medium">Knowledge ingested successfully!</p>
                </div>
              )}

              {/* Progress Bar */}
              {isSubmitting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                    <span>Ingesting knowledge...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                    />
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || status === 'success'}
              className="flex-[2] py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Database size={18} />
                  Ingest Knowledge
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GlobalKnowledgeModal;
