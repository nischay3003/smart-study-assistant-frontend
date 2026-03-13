import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, Loader2, Plus } from 'lucide-react';
import { ingestService } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

const FileUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    setFileName(file.name);
    setIsUploading(true);
    setStatus('idle');

    try {
      await ingestService.uploadPdf(file);
      setStatus('success');
      // setTimeout(() => {
      //   setStatus('idle');
      //   setFileName(null);
      // }, 3000);
    } catch (error) {
      console.error('Upload failed:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />
      {fileName && (
        <div className="mb-2 flex items-center gap-2">
          <FileText size={16} className="text-indigo-500" />
          <span className="text-xs font-medium text-slate-700 truncate">{fileName}</span>
        </div>
      )}
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
          status === 'success' 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
            : status === 'error'
            ? 'bg-rose-50 text-rose-600 border border-rose-200'
            : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100'
        }`}
      >
        {isUploading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle2 size={18} />
        ) : status === 'error' ? (
          <XCircle size={18} />
        ) : (
          <Plus size={18} />
        )}
        <span className="hidden sm:inline">
          {isUploading ? 'Ingesting...' : status === 'success' ? 'Ingested!' : status === 'error' ? 'Failed' : 'Add Notes'}
        </span>
      </button>

      <AnimatePresence>
        {fileName && isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-full right-0 mt-2 w-48 p-3 bg-white rounded-xl shadow-xl border border-slate-100 z-50"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-indigo-500" />
              <span className="text-xs font-medium text-slate-700 truncate">{fileName}</span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="h-full bg-indigo-600"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;
