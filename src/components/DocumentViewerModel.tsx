import React, { useEffect, useState, useRef } from 'react';
import { X, Loader2, FileText, Download } from 'lucide-react';
import API from '../services/api';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string | null;
  title: string | null;
  content?: string | null;
  documentType?: 'file' | 'text';
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ 
  isOpen, 
  onClose, 
  fileId, 
  title ,
  content,
  documentType

}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Cleanup function for blob URLs
  const cleanupBlobUrl = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {

        if (documentType === "file" && fileId) {

            fetchAndDisplayDocument();

        }
    }
    if (documentType === "text") {

      setFileName(
        title
          ? `${title}.txt`
          : "document.txt"
      );
    }

    // Cleanup when modal closes or component unmounts
    return () => {
      cleanupBlobUrl();
    };
  }, [isOpen, fileId]);

  const fetchAndDisplayDocument = async () => {
    // Clear previous blob URL if any
    cleanupBlobUrl();
    setLoading(true);
    setError(null);
    setBlobUrl(null);
    
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to view documents');
      }

      console.log('Fetching document with ID:', fileId);
    //   console.log("API URL:", `${process.env.VITE_BACKEND_URL}/document/view/${fileId}`);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/document/view/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load document: ${response.statusText}`);
      }

      // ✅ IMPORTANT: Get the blob from the response
      const blob = await response.blob();
      console.log('Blob received:', blob.type, blob.size);
      
      // ✅ Create blob URL ONLY from the blob
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setBlobUrl(url);
      
      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          setFileName(filenameMatch[1].replace(/['"]/g, ''));
        }
      }
      
    } catch (err: any) {
      console.error('Error fetching document:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (blobUrlRef.current) {
      const link = document.createElement('a');
      link.href = blobUrlRef.current;
      link.download = fileName || title || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900">
              {fileName || title || 'Document Viewer'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {blobUrl && (
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Download"
              >
                <Download size={18} />
              </button>
            )}
            <button
              onClick={() => {
                cleanupBlobUrl();
                onClose();
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative bg-slate-100">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
                <p className="text-slate-600 font-medium">Loading document...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center max-w-md p-6">
                <FileText size={48} className="mx-auto text-red-400 mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchAndDisplayDocument}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
          {documentType === "text" && (

            <div className="w-full h-full overflow-y-auto bg-white p-6">

                <pre className="whitespace-pre-wrap text-sm text-slate-800">
                {content}
                </pre>

            </div>
            )}

          {blobUrl && !loading && !error && (
            <iframe
              src={blobUrl}
              className="w-full h-full border-0"
              title="Document Viewer"
            //   sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
              onError={(e) => {
                console.error('Iframe failed to load:', e);
                setError('Failed to load document in viewer');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;