import axios from 'axios';



/**
 * BACKEND CONNECTION CONFIGURATION
 * 
 * 1. Change baseURL to your actual backend API URL (e.g., 'https://api.yourdomain.com')
 * 2. If your backend is on the same domain, keep it as '/api' or your base path.
 */
const api = axios.create({
  baseURL: 'http://localhost:5000', // <--- UPDATE THIS TO YOUR BACKEND URL
  headers: {
    'Content-Type': 'application/json',
    
  },
});

api.interceptors.request.use((config) => {

  const sessionId = sessionStorage.getItem("sessionId");

  if (sessionId) {
    config.headers["x-session-id"] = sessionId;
  }

  return config;
});


export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Suggestion {
  type: 'quiz';
  message: string;
  topic: string;
}

export interface AskResponse {
  answer: string;
  confidence: 'low' | 'medium' | 'high';
  topic: string;
  weakTopic: boolean;
  suggestion: Suggestion | null;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

export interface QuizSubmitRequest {
  topic: string;
  answers: number[];
  questions: { answerIndex: number }[];
}

export interface QuizSubmitResponse {
  score: number;
  total: number;
}

export interface IngestResponse {
  status: string;
  message: string;
}

export const chatService = {
  /**
   * CHAT API INTEGRATION
   * Endpoint: POST /api/ask
   */
  ask: async (question: string, chatHistory: Message[]): Promise<AskResponse> => {
    const response = await api.post<AskResponse>('/api/ask', { // <--- UPDATE ENDPOINT PATH IF NEEDED
      question,
      chat_history: chatHistory,
    });
    return response.data;
  },
};

export const ingestService = {
  /**
   * PDF INGESTION API INTEGRATION
   * Endpoint: POST /api/ingest/pdf
   * Payload: FormData with 'file' field
   */
  uploadPdf: async (file: File): Promise<IngestResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<IngestResponse>('/ingest/pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const quizService = {
  /**
   * QUIZ GENERATION API INTEGRATION
   * Endpoint: POST /api/quiz
   */
  getQuiz: async (topic: string, difficulty: string = 'easy'): Promise<QuizResponse> => {
    const response = await api.post<QuizResponse>('/api/quiz', { // <--- UPDATE ENDPOINT PATH IF NEEDED
      topic,
      difficulty,
    });
    return response.data;
  },

  /**
   * QUIZ SUBMISSION API INTEGRATION
   * Endpoint: POST /api/quiz/submit
   */
  submitQuiz: async (data: QuizSubmitRequest): Promise<QuizSubmitResponse> => {
    const response = await api.post<QuizSubmitResponse>('/api/quiz/submit', data); // <--- UPDATE ENDPOINT PATH IF NEEDED
    return response.data;
  },
};

export default api;
